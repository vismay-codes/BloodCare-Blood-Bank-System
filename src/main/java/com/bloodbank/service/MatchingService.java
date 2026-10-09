package com.bloodbank.service;

import com.bloodbank.model.*;
import com.bloodbank.repository.BloodBankRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
public class MatchingService {
    private final BloodBankRepository repo;
    private final CompatibilityService compatibility;

    public MatchingService(BloodBankRepository repo, CompatibilityService compatibility) {
        this.repo=repo; this.compatibility=compatibility;
    }

    @Transactional
    public List<MatchResult> fulfil(long requestId) {
        BloodRequest req=repo.getRequest(requestId);
        if ("FULFILLED".equals(req.status())) return List.of(new MatchResult(requestId,"SYSTEM","Already fulfilled",req.bloodGroup(),0,"Request is already fulfilled."));
        int remaining=req.unitsNeeded();
        List<MatchResult> results=new ArrayList<>();

        // Blood stock is consumed first. Compatible units are checked group by group.
        for(String donorGroup: compatibility.compatibleDonorGroups(req.bloodGroup())) {
            if(remaining<=0) break;
            for(BloodUnit u:repo.availableUnits(donorGroup, "")) {
                if(remaining<=0) break;
                int take=Math.min(remaining,u.quantity());
                if(repo.issueUnit(u.id(),take)) {
                    repo.logMatch(requestId,"STOCK",String.valueOf(u.id()),take,"Issued from "+u.hospitalName());
                    results.add(new MatchResult(requestId,"STOCK",u.hospitalName(),donorGroup,take,"Stock allocated."));
                    remaining-=take;
                }
            }
        }

        if(remaining==0) {
            repo.updateRequestStatus(requestId,"FULFILLED");
            return results;
        }

        // Eligible donors are ranked by same city, then oldest donation date.
        List<Donor> candidates=new ArrayList<>();
        for(String group: compatibility.compatibleDonorGroups(req.bloodGroup())) {
            candidates.addAll(repo.eligibleDonors(group, null));
        }
        candidates.sort(Comparator.comparing((Donor d)->!Objects.equals(d.city(),req.city()))
                .thenComparing(Donor::lastDonationDate, Comparator.nullsFirst(Comparator.naturalOrder())));

        for(Donor d:candidates) {
            if(remaining<=0) break;
            repo.logMatch(requestId,"DONOR",String.valueOf(d.id()),1,"Eligible donor suggestion.");
            results.add(new MatchResult(requestId,"DONOR",d.fullName()+" â€¢ "+d.city(),d.bloodGroup(),1,
                    "Eligible donor suggested; contact donor through authorized blood-bank workflow."));
            remaining--;
        }

        repo.updateRequestStatus(requestId, remaining==0 ? "FULFILLED" : "PARTIAL");
        return results;
    }
}



