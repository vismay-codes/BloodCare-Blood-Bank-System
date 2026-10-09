package com.bloodbank.controller;

import com.bloodbank.model.*;
import com.bloodbank.repository.BloodBankRepository;
import com.bloodbank.service.CompatibilityService;
import com.bloodbank.service.MatchingService;
import com.bloodbank.service.RequestQueueService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins="*")
public class BloodBankController {
    private final BloodBankRepository repo;
    private final CompatibilityService compatibility;
    private final MatchingService matching;
    private final RequestQueueService queue;

    public BloodBankController(BloodBankRepository repo,CompatibilityService compatibility,MatchingService matching,RequestQueueService queue){
        this.repo=repo;this.compatibility=compatibility;this.matching=matching;this.queue=queue;
    }

    @GetMapping("/dashboard")
    public DashboardStats dashboard(){repo.markExpired();repo.refreshDonorEligibility();return repo.dashboard();}

    @GetMapping("/analytics")
    public Analytics analytics(){return repo.analytics();}

    @GetMapping("/stock/summary")
    public List<Map<String,Object>> stock(){repo.markExpired();return repo.stockSummary();}

    @GetMapping("/stock/expiring")
    public List<BloodUnit> expiring(@RequestParam(defaultValue="3") int days){repo.markExpired();return repo.expiring(Math.max(0,Math.min(days,30)));}

    @PostMapping("/stock")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String,Object> addStock(@RequestBody BloodUnit u){
        if(u.quantity()<=0 || u.expiryDate()==null || u.collectionDate()==null) throw new IllegalArgumentException("Valid quantity and dates are required.");
        long id=repo.addUnit(u);
        return Map.of("id",id,"message","Blood unit added successfully");
    }

    @PostMapping("/stock/{id}/issue")
    public Map<String,Object> issue(@PathVariable long id,@RequestParam(defaultValue="1") int quantity){
        if(quantity<=0) throw new IllegalArgumentException("Quantity must be positive.");
        return Map.of("success",repo.issueUnit(id,quantity));
    }

    @GetMapping("/donors")
    public Map<String,Object> donors(@RequestParam(required=false) String bloodGroup,@RequestParam(required=false) String city,
                                     @RequestParam(defaultValue="1") int page,@RequestParam(defaultValue="8") int size){
        repo.refreshDonorEligibility();
        page=Math.max(page,1); size=Math.max(1,Math.min(size,50));
        int total=repo.donorCount(bloodGroup,city);
        return Map.of("items",repo.findDonors(bloodGroup,city,size,(page-1)*size),"page",page,"size",size,"total",total,
                "pages",(int)Math.ceil(total/(double)size));
    }

    @PostMapping("/donors")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String,Object> addDonor(@RequestBody Donor d){
        validateGroup(d.bloodGroup());
        if(d.fullName()==null||d.fullName().isBlank()||d.city()==null||d.city().isBlank()) throw new IllegalArgumentException("Name and city are required.");
        long id=repo.addDonor(d);
        return Map.of("id",id,"message","Donor registered successfully");
    }

    @GetMapping("/donors/compatible")
    public List<String> compatible(@RequestParam String recipient){validateGroup(recipient);return compatibility.compatibleDonorGroups(recipient);}

    @GetMapping("/requests/queue")
    public List<BloodRequest> queue(){return queue.prioritizedQueue();}

    @PostMapping("/requests")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String,Object> request(@RequestBody BloodRequest r){
        validateGroup(r.bloodGroup());
        if(r.unitsNeeded()<=0) throw new IllegalArgumentException("Units needed must be positive.");
        long id=repo.createRequest(r);
        return Map.of("id",id,"message","Request created and placed in priority queue");
    }

    @PostMapping("/requests/{id}/fulfil")
    public List<MatchResult> fulfil(@PathVariable long id){return matching.fulfil(id);}

    @PostMapping("/donors/{id}/donate")
    public Map<String,Object> donation(@PathVariable long id,@RequestParam(required=false) String date){
        LocalDate d=date==null?LocalDate.now():LocalDate.parse(date);
        repo.recordDonation(id,d);
        return Map.of("message","Donation history recorded; donor temporarily marked unavailable.");
    }

    private void validateGroup(String g){
        if(g==null || !List.of("O-","O+","A-","A+","B-","B+","AB-","AB+").contains(g.toUpperCase()))
            throw new IllegalArgumentException("Invalid blood group.");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String,String> bad(IllegalArgumentException e){return Map.of("error",e.getMessage());}
}
