package com.campusfix.backend.service;

import com.campusfix.backend.dto.ComplaintRequest;
import com.campusfix.backend.dto.ComplaintResponse;
import com.campusfix.backend.dto.StatusUpdateRequest;
import com.campusfix.backend.entity.Complaint;
import com.campusfix.backend.repository.ComplaintRepository;
import com.campusfix.backend.service.impl.ComplaintServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class ComplaintServiceImplTest {

    @Mock
    private ComplaintRepository complaintRepository;

    @InjectMocks
    private ComplaintServiceImpl complaintService;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testGetAllComplaintsWithoutFilter() {
        Complaint c1 = new Complaint();
        c1.setId(1L);
        c1.setComplaintId("CMP-1111");
        c1.setComplaintTitle("Fan broken");
        c1.setCategory("Electrical");
        c1.setStatus("Submitted");
        c1.setCreatedAt(LocalDateTime.now());

        when(complaintRepository.findAll()).thenReturn(List.of(c1));

        List<ComplaintResponse> responses = complaintService.getAllComplaints(null, null, null, null);
        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getComplaintId()).isEqualTo("CMP-1111");
        verify(complaintRepository, times(1)).findAll();
    }

    @Test
    public void testGetAllComplaintsWithFilter() {
        Complaint c1 = new Complaint();
        c1.setId(1L);
        c1.setComplaintId("CMP-2222");
        c1.setComplaintTitle("Water leak");
        c1.setCategory("Plumbing");
        c1.setStatus("Submitted");
        c1.setCreatedAt(LocalDateTime.now());

        when(complaintRepository.filterComplaints("Submitted", "Plumbing", null, null)).thenReturn(List.of(c1));

        List<ComplaintResponse> responses = complaintService.getAllComplaints("Submitted", "Plumbing", null, null);
        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getCategory()).isEqualTo("Plumbing");
        verify(complaintRepository, times(1)).filterComplaints("Submitted", "Plumbing", null, null);
    }

    @Test
    public void testGetComplaintByIdOrCodeSuccess() {
        Complaint c1 = new Complaint();
        c1.setId(10L);
        c1.setComplaintId("CMP-ABC1");
        c1.setComplaintTitle("Projector issue");
        c1.setCategory("Electrical");
        c1.setStatus("Submitted");
        c1.setCreatedAt(LocalDateTime.now());

        when(complaintRepository.findById(10L)).thenReturn(Optional.of(c1));

        ComplaintResponse res = complaintService.getComplaintByIdOrCode("10");
        assertThat(res).isNotNull();
        assertThat(res.getComplaintId()).isEqualTo("CMP-ABC1");
    }

    @Test
    public void testGetComplaintByIdOrCodeNotFound() {
        when(complaintRepository.findById(99L)).thenReturn(Optional.empty());
        when(complaintRepository.findByComplaintId("CMP-9999")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> complaintService.getComplaintByIdOrCode("CMP-9999"))
                .isInstanceOf(NoSuchElementException.class)
                .hasMessageContaining("Complaint ticket not found");
    }

    @Test
    public void testCreateComplaintSuccess() {
        ComplaintRequest req = new ComplaintRequest();
        req.setComplaintTitle("Broken Chair");
        req.setCategory("Furniture");
        req.setBuilding("Block A");
        req.setDescription("Leg is broken off completely.");
        req.setPriority("Medium");
        req.setStatus("Submitted");

        when(complaintRepository.save(any(Complaint.class))).thenAnswer(invocation -> {
            Complaint arg = invocation.getArgument(0);
            arg.setId(1L);
            return arg;
        });

        ComplaintResponse res = complaintService.createComplaint(req);
        assertThat(res).isNotNull();
        assertThat(res.getComplaintId()).startsWith("CMP-");
        assertThat(res.getComplaintTitle()).isEqualTo("Broken Chair");
        verify(complaintRepository, times(1)).save(any(Complaint.class));
    }

    @Test
    public void testPatchComplaintStatusSuccess() {
        Complaint c1 = new Complaint();
        c1.setId(1L);
        c1.setComplaintId("CMP-STAT");
        c1.setStatus("Submitted");
        c1.setCreatedAt(LocalDateTime.now());

        when(complaintRepository.findByComplaintId("CMP-STAT")).thenReturn(Optional.of(c1));
        when(complaintRepository.save(any(Complaint.class))).thenAnswer(invocation -> invocation.getArgument(0));

        StatusUpdateRequest patchReq = new StatusUpdateRequest();
        patchReq.setStatus("In Progress");

        ComplaintResponse res = complaintService.patchComplaintStatus("CMP-STAT", patchReq);
        assertThat(res.getStatus()).isEqualTo("In Progress");
    }

    @Test
    public void testGetComplaintStats() {
        Complaint c1 = new Complaint();
        c1.setStatus("Submitted");
        c1.setCategory("Electrical");
        Complaint c2 = new Complaint();
        c2.setStatus("Resolved");
        c2.setCategory("Plumbing");

        when(complaintRepository.findAll()).thenReturn(List.of(c1, c2));

        Map<String, Object> stats = complaintService.getComplaintStats();
        assertThat(stats).isNotNull();
        assertThat(stats.get("total")).isEqualTo(2L);
        assertThat(stats.get("submitted")).isEqualTo(1L);
        assertThat(stats.get("resolved")).isEqualTo(1L);
    }

    @Test
    public void testSuggestPriority() {
        Map<String, String> suggestion = complaintService.suggestPriority("Electrical spark in lab", "Dangerous smoke and sparks", "Electrical");
        assertThat(suggestion.get("suggestedPriority")).isEqualTo("Critical");
        assertThat(suggestion.get("reason")).contains("Safety hazard");
    }
}
