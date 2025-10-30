"use client";

import { useParams } from "next/navigation"; // get dynamic route params
import styles from "./interface.module.css";
// import CharacterPanel from "./components/characterPanel/characterPanel";
// import ChatPanel from "./components/chatPanel/chatPanel";
import ItemPanel from "./components/itemPanel/itemPanel";
import DicePanel from "./components/dicePanel/dicePanel";

interface Campaign {
  id: number;
  name: string;
}

export default function CampaignPage() {
  const params = useParams();
  const { id } = params; // dynamic route id as string

  // Example: if you fetch campaign data, you could do it here
  // For now, just simulating a campaign object
  const campaign: Campaign = {
    id: Number(id),
    name: `Campaign #${id}`,
  };

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.header}>{campaign.name}</h1>

      <div className={styles.panelsGrid}>
        {/* Layout example: 2x2 grid */}
        {/* <CharacterPanel />
        <ChatPanel /> */}
        <ItemPanel />
        <DicePanel />
      </div>
    </div>
  );
}