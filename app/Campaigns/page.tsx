"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // <-- import router
import styles from "./campaign.module.css";

interface Campaign {
  id: number;
  name: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [nextId, setNextId] = useState(1);

  const router = useRouter(); // initialize router

  const addCampaign = () => {
    if (campaigns.length >= 5) {
      alert("You can only have up to 5 campaigns at a time.");
      return;
    }

    const newCampaign: Campaign = {
      id: nextId,
      name: `Temporary Campaign #${nextId}`,
    };

    setCampaigns((prev) => [newCampaign, ...prev]);
    setNextId((id) => id + 1);
  };

  const deleteCampaign = (id: number) => {
    const confirmed = confirm("Are you sure you wish to delete this campaign?");
    if (confirmed) {
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const goToCampaign = (id: number) => {
    router.push(`/campaigns/${id}`); // navigate to campaign page
  };

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.header}>Your Campaigns</h1>

      <div className={styles.innerContainer}>
        <div className={styles.panelsContainer}>
          {/* New Campaign Panel */}
          <div
            className={styles.newCampaignPanel}
            onClick={addCampaign}
            role="button"
            aria-label="Create new campaign"
          >
            <div className={styles.plusCircle}>+</div>
            <span>New Campaign</span>
          </div>

          {/* Render campaigns in order: newest first */}
          {campaigns.map((c) => (
            <div
              key={c.id}
              className={styles.campaignPanel}
              onClick={() => goToCampaign(c.id)} // navigate on click
              style={{ cursor: "pointer" }}
            >
              <div className={styles.campaignInfo}>{c.name}</div>
              <button
                className={styles.deleteButton}
                onClick={(e) => {
                  e.stopPropagation(); // prevent panel click from firing
                  deleteCampaign(c.id);
                }}
              >
                Delete Campaign
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
