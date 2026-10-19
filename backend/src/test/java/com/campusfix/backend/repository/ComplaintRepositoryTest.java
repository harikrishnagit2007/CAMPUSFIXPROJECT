package com.campusfix.backend.repository;

import com.campusfix.backend.entity.Complaint;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
public class ComplaintRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private ComplaintRepository complaintRepository;

    @Test
    public void testFindByComplaintId() {
        Complaint complaint = new Complaint();
        complaint.setComplaintId("CMP-TEST1234");
        complaint.setComplaintTitle("Projector not working in Tech Hall");
        complaint.setCategory("Electrical");
        complaint.setBuilding("Technology Block A");
        complaint.setDescription("The projector powers off every 10 minutes.");
        complaint.setPriority("High");
        complaint.setStatus("Submitted");
        complaint.setCreatedAt(LocalDateTime.now());

        entityManager.persistAndFlush(complaint);

        Optional<Complaint> found = complaintRepository.findByComplaintId("CMP-TEST1234");
        assertThat(found).isPresent();
        assertThat(found.get().getComplaintTitle()).isEqualTo("Projector not working in Tech Hall");
        assertThat(found.get().getCategory()).isEqualTo("Electrical");
    }

    @Test
    public void testFindActiveComplaints() {
        Complaint c1 = new Complaint();
        c1.setComplaintId("CMP-ACT1");
        c1.setComplaintTitle("Leaking faucet");
        c1.setCategory("Plumbing");
        c1.setBuilding("Hostel Block B");
        c1.setPriority("Medium");
        c1.setStatus("Submitted");
        c1.setCreatedAt(LocalDateTime.now().minusHours(2));
        entityManager.persist(c1);

        Complaint c2 = new Complaint();
        c2.setComplaintId("CMP-ACT2");
        c2.setComplaintTitle("Fixed door knob");
        c2.setCategory("Furniture");
        c2.setBuilding("Admin Block");
        c2.setPriority("Low");
        c2.setStatus("Resolved");
        c2.setCreatedAt(LocalDateTime.now().minusDays(1));
        entityManager.persist(c2);

        entityManager.flush();

        List<Complaint> active = complaintRepository.findActiveComplaints();
        assertThat(active).hasSize(1);
        assertThat(active.get(0).getComplaintId()).isEqualTo("CMP-ACT1");
    }

    @Test
    public void testFilterComplaints() {
        Complaint c1 = new Complaint();
        c1.setComplaintId("CMP-FLT1");
        c1.setComplaintTitle("Power outage in Lab");
        c1.setCategory("Electrical");
        c1.setBuilding("Science Block");
        c1.setPriority("Critical");
        c1.setStatus("In Progress");
        c1.setCreatedAt(LocalDateTime.now());
        entityManager.persist(c1);

        entityManager.flush();

        List<Complaint> filtered = complaintRepository.filterComplaints("In Progress", "Electrical", "Critical", "Science Block");
        assertThat(filtered).hasSize(1);
        assertThat(filtered.get(0).getComplaintId()).isEqualTo("CMP-FLT1");

        List<Complaint> emptyFilter = complaintRepository.filterComplaints("Resolved", null, null, null);
        assertThat(emptyFilter).isEmpty();
    }
}
