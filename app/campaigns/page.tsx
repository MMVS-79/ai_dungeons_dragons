"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./campaign.module.css";

interface Campaign {
  id: number;
  name: string;
  description?: string;
  state: string;
  createdAt: string;
  updatedAt: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campaignToDelete, setCampaignToDelete] = useState<number | null>(null);

  const router = useRouter();

  // Fetch campaigns from API on mount
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const response = await fetch("/api/campaigns");
        const data = await response.json();

        if (!response.ok) {
          // If 401, user needs to login
          if (response.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error(data.error || "Failed to fetch campaigns");
        }

        setCampaigns(data.campaigns);
      } catch (err) {
        console.error("Failed to fetch campaigns:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load campaigns"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampaigns();
  }, [router]);

  const goToNewCampaign = () => {
    if (campaigns.length >= 5) {
      alert("You can only have up to 5 campaigns at a time.");
      return;
    }
    router.push("/campaigns/new");
  };

  const openDeleteModal = (id: number) => {
    setCampaignToDelete(id);
  };

  const closeDeleteModal = () => {
    setCampaignToDelete(null);
  };

  const confirmDelete = async () => {
    if (campaignToDelete === null) return;

    try {
      const response = await fetch(`/api/campaigns/${campaignToDelete}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error("Failed to delete campaign");
      }

      // Remove from local state
      setCampaigns((prev) => prev.filter((c) => c.id !== campaignToDelete));
      closeDeleteModal();
    } catch (err) {
      console.error("Failed to delete campaign:", err);
      alert("Failed to delete campaign. Please try again.");
      closeDeleteModal();
    }
  };

  const goToCampaign = (id: number) => {
    router.push(`/campaigns/${id}`);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className={styles.pageContainer}>
        <h1 className={styles.header}>Your Campaigns</h1>
        <div className={styles.innerContainer}>
          <p>Loading campaigns...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={styles.pageContainer}>
        <h1 className={styles.header}>Your Campaigns</h1>
        <div className={styles.innerContainer}>
          <p style={{ color: "red" }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.header}>Your Campaigns</h1>

      <div className={styles.innerContainer}>
        <div className={styles.panelsContainer}>
          {/* New Campaign Panel */}
          <div
            className={styles.newCampaignPanel}
            onClick={goToNewCampaign}
            role="button"
            aria-label="Create new campaign"
          >
            <div className={styles.plusCircle}>+</div>
            <span>New Campaign</span>
          </div>

          {/* Render campaigns in order: newest first (from API) */}
          {campaigns.map((c) => (
            <div
              key={c.id}
              className={styles.campaignPanel}
              onClick={() => goToCampaign(c.id)}
              style={{ cursor: "pointer" }}
            >
              <div className={styles.campaignInfo}>{c.name}</div>
              <button
                className={styles.deleteButton}
                onClick={(e) => {
                  e.stopPropagation();
                  openDeleteModal(c.id);
                }}
              >
                Delete Campaign
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {campaignToDelete !== null && (
        <div
          className={styles.modalOverlay}
          onClick={closeDeleteModal}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className={styles.modalTitle}>Delete Campaign?</h2>
            <p className={styles.modalText}>
              Are you sure you want to delete this campaign? This action is
              permanent and cannot be undone.
            </p>
            <div className={styles.modalButtons}>
              <button
                className={styles.modalButtonCancel}
                onClick={closeDeleteModal}
              >
                Cancel
              </button>
              <button
                className={styles.modalButtonConfirm}
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
