package com.bloodbank.service;

import com.bloodbank.model.BloodRequest;
import com.bloodbank.repository.BloodBankRepository;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class RequestQueueService {
    private final BloodBankRepository repo;

    public RequestQueueService(BloodBankRepository repo){this.repo=repo;}

    public List<BloodRequest> prioritizedQueue() {
        Comparator<BloodRequest> c=Comparator
            .comparingInt((BloodRequest r)->priority(r.urgency())).reversed()
            .thenComparing(BloodRequest::createdAt);
        PriorityQueue<BloodRequest> pq=new PriorityQueue<>(c);
        pq.addAll(repo.pendingRequests());
        List<BloodRequest> out=new ArrayList<>();
        while(!pq.isEmpty()) out.add(pq.poll());
        return out;
    }

    private int priority(String urgency) {
        return switch(urgency==null?"NORMAL":urgency.toUpperCase()) {
            case "CRITICAL" -> 3;
            case "URGENT" -> 2;
            default -> 1;
        };
    }
}
