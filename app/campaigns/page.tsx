"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import CampaignPreviewCard from "./components/campaignPreviewCard";
import styles from "./campaign.module.css";

interface Campaign {
  id: number;
  name: string;
  description?: string;
  state: "active" | "completed" | "game_over";
  createdAt: string;
  updatedAt: string;
}

interface Character {
  id: number;
  name: string;
  currentHealth: number;
  maxHealth: number;
  attack: number;
  defense: number;
  spritePath?: string;
}

interface Equipment {
  weapon?: {
    id: number;
    name: string;
    attack: number;
    spritePath?: string;
  };
  armour?: {
    id: number;
    name: string;
    health: number;
    spritePath?: string;
  };
  shield?: {
    id: number;
    name: string;
    defense: number;
    spritePath?: string;
  };
}

interface CampaignPreview {
  campaign: Campaign;
  character: Character;
  equipment: Equipment;
  inventory: Item[];
  lastEvent: {
    message: string;
  } | null;
  currentEventNumber: number;
}

interface Item {
  id: number;
  name: string;
  rarity: number;
  statModified: "health" | "attack" | "defense";
  statValue: number;
  description?: string;
  spritePath?: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignPreviews, setCampaignPreviews] = useState<
    Map<number, CampaignPreview>
  >(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campaignToDelete, setCampaignToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadingPreviews, setLoadingPreviews] = useState(false);

  const router = useRouter();
  const { data: session, status } = useSession();

  // Fetch campaigns from API on mount
  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

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
          err instanceof Error ? err.message : "Failed to load campaigns",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampaigns();
  }, [router, session, status]);

  // Fetch preview data for each campaign
  useEffect(() => {
    if (campaigns.length === 0) return;

    const fetchPreviews = async () => {
      setLoadingPreviews(true);
      const previews = new Map<number, CampaignPreview>();

      try {
        await Promise.all(
          campaigns.map(async (campaign) => {
            try {
              const response = await fetch(
                `/api/campaigns/${campaign.id}/preview`
              );
              const data = await response.json();

              if (data.success && data.preview) {
                previews.set(campaign.id, data.preview);
              }
            } catch (err) {
              console.error(
                `Failed to load preview for campaign ${campaign.id}:`,
                err
              );
            }
          })
        );

        setCampaignPreviews(previews);
      } catch (err) {
        console.error("Failed to load campaign previews:", err);
      } finally {
        setLoadingPreviews(false);
      }
    };

    fetchPreviews();
  }, [campaigns]);

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
    setIsDeleting(false);
  };

  const confirmDelete = async () => {
    if (campaignToDelete === null || isDeleting) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/campaigns/${campaignToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete campaign");
      }

      // Remove from local state
      setCampaigns((prev) => prev.filter((c) => c.id !== campaignToDelete));
      setCampaignPreviews((prev) => {
        const newPreviews = new Map(prev);
        newPreviews.delete(campaignToDelete);
        return newPreviews;
      });
      closeDeleteModal();
    } catch (err) {
      console.error("Failed to delete campaign:", err);
      alert("Failed to delete campaign. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const goToCampaign = (id: number) => {
    router.push(`/campaigns/${id}`);
  };

  // Show loading state
  if (isLoading || status === "loading") {
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

          {/* Render campaign preview cards */}
          {campaigns.map((campaign) => {
            const preview = campaignPreviews.get(campaign.id);

            // Show loading skeleton if preview not loaded yet
            if (!preview) {
              return (
                <div
                  key={campaign.id}
                  className={styles.campaignPanel}
                  style={{ opacity: 0.6 }}
                >
                  <div className={styles.campaignInfo}>
                    {loadingPreviews ? "Loading..." : campaign.name}
                  </div>
                </div>
              );
            }

            return (
              <CampaignPreviewCard
                key={campaign.id}
                campaign={preview.campaign}
                character={preview.character}
                equipment={preview.equipment}
                inventory={preview.inventory}
                lastEventMessage={preview.lastEvent?.message || null}
                currentEventNumber={preview.currentEventNumber}
                onClick={() => goToCampaign(campaign.id)}
                onDelete={(e) => {
                  e.stopPropagation();
                  openDeleteModal(campaign.id);
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {campaignToDelete !== null && (
        <div className={styles.modalOverlay} onClick={closeDeleteModal}>
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
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className={styles.modalButtonConfirm}
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}