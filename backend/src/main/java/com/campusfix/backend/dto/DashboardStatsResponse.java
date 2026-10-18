package com.campusfix.backend.dto;

public class DashboardStatsResponse {

    private long totalLost;
    private long totalFound;
    private long openLost;
    private long openFound;
    private long activeClaims;
    private long returnedItems;
    private long potentialMatches;

    public DashboardStatsResponse() {}

    public long getTotalLost() { return totalLost; }
    public void setTotalLost(long totalLost) { this.totalLost = totalLost; }

    public long getTotalFound() { return totalFound; }
    public void setTotalFound(long totalFound) { this.totalFound = totalFound; }

    public long getOpenLost() { return openLost; }
    public void setOpenLost(long openLost) { this.openLost = openLost; }

    public long getOpenFound() { return openFound; }
    public void setOpenFound(long openFound) { this.openFound = openFound; }

    public long getActiveClaims() { return activeClaims; }
    public void setActiveClaims(long activeClaims) { this.activeClaims = activeClaims; }

    public long getReturnedItems() { return returnedItems; }
    public void setReturnedItems(long returnedItems) { this.returnedItems = returnedItems; }

    public long getPotentialMatches() { return potentialMatches; }
    public void setPotentialMatches(long potentialMatches) { this.potentialMatches = potentialMatches; }
}
