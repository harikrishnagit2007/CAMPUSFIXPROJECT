package com.campusfix.backend.dto;

import java.util.ArrayList;
import java.util.List;

public class PotentialMatchResult {

    private LostFoundItemResponse matchedItem;
    private int matchScore; // 0 to 100 percentage
    private List<String> matchReasons = new ArrayList<>();

    public PotentialMatchResult() {}

    public PotentialMatchResult(LostFoundItemResponse matchedItem, int matchScore, List<String> matchReasons) {
        this.matchedItem = matchedItem;
        this.matchScore = matchScore;
        this.matchReasons = matchReasons != null ? matchReasons : new ArrayList<>();
    }

    public LostFoundItemResponse getMatchedItem() { return matchedItem; }
    public void setMatchedItem(LostFoundItemResponse matchedItem) { this.matchedItem = matchedItem; }

    public int getMatchScore() { return matchScore; }
    public void setMatchScore(int matchScore) { this.matchScore = matchScore; }

    public List<String> getMatchReasons() { return matchReasons; }
    public void setMatchReasons(List<String> matchReasons) { this.matchReasons = matchReasons; }
}
