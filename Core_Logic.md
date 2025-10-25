## This is an explanation of the Event_Handler core logic ###

### Main event types are: "Environmental", "Descriptive", "Item_Drop" and "Combat"(Combat generalized as event to smooth out engine execution).

  "Environmental" : LLM responds with event_type: "Environmental", UI layout includes background, player_sprite, non_player_sprite, Text_box, Button_1 and Button_2.  
  LLM responds with descriptive text displayed to front_end(in text_box), provides 2 Jsons each representing one option.  
  Option 1 maps to button_1 = "Accept", Option 2 maps to button_2 = "Decline".  
  Option 2 ALWAYS cancels the event and directly sends endpoint to engine.  
  Option 1 modifies a singular stat of the player, once action_event received, prompts player to roll a dice:  
          Critical Failure: 1 <= dice_roll <= 4.  
                Player does not receive the initial stat bonus, additionally incurs health penalty scaling from 20-80% of current Health(not max, player can't be killed by this).
                At dice_roll = 1, backend additionally rolls for "Death" at 10%, if hit, player dies.  
          Regular Dice_roll: 5 <= dice_roll <= 15.  
                Player receive a scaled amount of the stat bonus = original_amount*((dice_roll-10)/10+1), max 150% efficacy, min 50% efficacy.  
          Critical Success: Player either receives healing scaling from 20-100% of max_HP based on dice_roll amount above 15, or receives a parallel stat boost(if org=ATK gain max_HP or DEF)  
          Note: I'm thinking about making this a LLM call because if I'm gonna roll a dice to determine which half of the coin gives which type of bonus then if I land in stat I have to roll for type of stat gain, at that point it's simpler to just ask Gemini, what do you want to do, and if you choose stat, decide which stat and how much.  

  "Descriptive": UI is player_sprite, background and text_box with button "Keep Going" or "Continue On", which sends endpoint to engine signaling the player's done reading.
  Makes the player read funny text, nothing happens.  

  "Item_Drop" : Same UI as "Environmental" except the non_player sprite is the item, for example, an "Orcish_Stinger"(#003) on the ground.  
  Option 2 is still decline.  
  Option 1: LLM now returns a candidate key: Equipment_Score. Each Equipment_Score exists uniquely for the item entity table in the DB, AKA a "Chipped_Knife" will be the only item in table "Sword" that has a value of 0.   
  Look_up performed on this attribute for matching item and returns success, backend fetches the item and uses item immediately!(If = equipment, equip = True. If = potion, restore HP immediately even if full. I don't want you to drink potions in combat, for now, I'm starting to see how complicated that makes things.)  

  Dice_roll(This is the advanced stuff):  
          Critical Failure: 1 <= dice_roll <= 4.  
                Same HP punishment logic for potions, it turns into poison. Equipment breaks and hurts you.(I considered a tier down system but it doesn't match the same strength of penalty of the "Environmental" Critcal failure.)  
                At dice_roll = 1, backend additionally rolls for "Death" at 10%, if hit, player dies.  
          Regular Dice_roll: 5 <= dice_roll <= 15.  
                Player receives the equipment. ONLY potion scales on effectiveness similar to "Environmental".  
          Critical Success: Equipment can TIER UP! Equipment_Score now increments in the backend. Equipment_Score goes up by a maximum of 4 based on dice_roll, (4 at dice_roll = 20), backend performs fetch on the "New_Equipment" and applies it to player. Equipment_Score is capped at the maximum # of rows minus header in the corresponding equipment entity table.  
                Potion max heals, yes it's boring but skill issue if you roll 20 on a potion.  
  "Combat": To be implemented separately, but the UI is player_sprite, monster_sprite, background, text_box and button_1, button_2.  

  Don't @ me, I decided to change some stuff while I was writing this, so if you see missing implementation in the code, that means it's WIP and I decided to adapt it.  
