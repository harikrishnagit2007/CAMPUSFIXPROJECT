package com.campusfix.backend.repository;

import com.campusfix.backend.entity.LostFoundItem;
import com.campusfix.backend.entity.enums.ItemStatus;
import com.campusfix.backend.entity.enums.ItemType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
public class LostFoundItemRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private LostFoundItemRepository lostFoundItemRepository;

    @Test
    public void testFindByItemCode() {
        LostFoundItem item = new LostFoundItem();
        item.setItemCode("LF-TEST9999");
        item.setItemName("MacBook Pro 14");
        item.setType(ItemType.LOST);
        item.setCategory("Electronics");
        item.setBuilding("Library Building");
        item.setDescription("Space gray laptop with stickers on lid.");
        item.setStatus(ItemStatus.OPEN);
        item.setCreatedAt(LocalDateTime.now());

        entityManager.persistAndFlush(item);

        Optional<LostFoundItem> found = lostFoundItemRepository.findByItemCode("LF-TEST9999");
        assertThat(found).isPresent();
        assertThat(found.get().getItemName()).isEqualTo("MacBook Pro 14");
        assertThat(found.get().getType()).isEqualTo(ItemType.LOST);
    }

    @Test
    public void testSearchItems() {
        LostFoundItem item1 = new LostFoundItem();
        item1.setItemCode("LF-SCH1");
        item1.setItemName("Student ID Card");
        item1.setType(ItemType.FOUND);
        item1.setCategory("Documents");
        item1.setBuilding("Cafeteria");
        item1.setDescription("ID card for Computer Science student.");
        item1.setStatus(ItemStatus.OPEN);
        item1.setCreatedAt(LocalDateTime.now());
        entityManager.persist(item1);

        entityManager.flush();

        List<LostFoundItem> results = lostFoundItemRepository.searchItems(ItemType.FOUND, "Documents", "Cafeteria", ItemStatus.OPEN, "Student");
        assertThat(results).hasSize(1);
        assertThat(results.get(0).getItemCode()).isEqualTo("LF-SCH1");
    }

    @Test
    public void testFindCandidateMatches() {
        LostFoundItem foundItem = new LostFoundItem();
        foundItem.setItemCode("LF-FND1");
        foundItem.setItemName("Scientific Calculator");
        foundItem.setType(ItemType.FOUND);
        foundItem.setCategory("Electronics");
        foundItem.setBuilding("Engineering Block");
        foundItem.setStatus(ItemStatus.OPEN);
        foundItem.setCreatedAt(LocalDateTime.now());
        entityManager.persist(foundItem);

        entityManager.flush();

        List<LostFoundItem> candidates = lostFoundItemRepository.findCandidateMatches(ItemType.FOUND, "Electronics", "Engineering Block");
        assertThat(candidates).hasSize(1);
        assertThat(candidates.get(0).getItemCode()).isEqualTo("LF-FND1");
    }
}
