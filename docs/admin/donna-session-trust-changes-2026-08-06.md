# What changed in the admin console — session review tools

*For Donna — plain-language summary, no engineering detail. Shipped 2026-08-06.*

None of this is automatic. Nothing here approves, declines, or deletes anything on its own — every change just gives you more information or a safety check before you click something. You're still the one making every call.

## 1. Court order hours — you can now fix them yourself

Before, if a volunteer's required hours, due date, or case number was wrong, someone had to go into the old admin tool to fix it. Now there's an **Edit** button right on the volunteer's profile page, next to their Court Order info. Click it, update the numbers, save — done.

## 2. A warning before you approve too many hours

If approving a session (or adjusting someone's hours) would push a court-ordered volunteer **past** the hours the court actually required, you'll now see a warning right there: *"This will bring completed hours to 42.5 of 40 required — 2.5 over."*

If you still want to go ahead — maybe it's legitimately fine — you'll need to type the word **OVERRIDE** into a box before it lets you confirm. That's on purpose: it's a deliberate extra step so it never happens by accident or under pressure from someone pushing you to just click through.

This doesn't block you. It just makes sure it's a real decision, not a slip.

## 3. The app now double-checks GPS on its own

This one's invisible to you day-to-day, but it matters: up until now, the app basically trusted whatever the volunteer's phone reported for distance walked and the walking path — even though a modified app could fake that data. Now, when a session finishes, our own server independently checks the math (Was the pace faster than a person can walk? Did the route ever actually leave a tiny area, even though it claims a mile? Was the phone just sitting still for a long time?). That check happens no matter what the phone says.

You'll see the results of this check show up as part of the new red-flag badges below (#5).

## 4. A new "Activity Pattern" box on volunteer profiles

Underneath a volunteer's Court Order info, there's now an **Activity Pattern** card that summarizes trends across their whole history, so you don't have to scroll through every session yourself:

- How many sessions they've logged in the last 7 days, vs. their normal pace
- How many sessions came back `invalid` in the last 30 days
- How many sessions they've deleted and resubmitted, ever
- For court-ordered volunteers: whether their sessions are unusually clustered right before their due date

This is just a summary of things that were already visible one row at a time — nothing new is being collected about them. And it's explicitly labeled "trends only, not a score" — a busy week isn't proof of anything by itself.

*(One process note for whoever owns this: because this is the first place we roll up a volunteer's history into a pattern instead of showing it session-by-session, our privacy policy language should get a small update to mention that admins may review patterns across someone's history, not just individual sessions. That's a policy-wording fast-follow, not something blocking this feature — flagging it here so it doesn't get lost.)*

## 5. Red-flag badges right on the session

When you open a session in the review drawer, you may now see a small badge like **"2 flags to review"** next to the status. Click or hover it to see exactly why — things like:

- A long session with very few checkpoint photos
- A route that implies the person was moving faster than walking pace
- A route that claims real distance but never actually leaves a small area (parking-lot loop)
- Checkpoint photos that were taken noticeably off the mapped route
- Sessions clustered suspiciously close to a court deadline
- A pattern of invalid or deleted/resubmitted sessions for that volunteer

**Important:** this is a checklist prompt, not a verdict. One flag doesn't mean decline — it means "look a little closer at the map and photos before you decide." That's true even when several flags show up together; it's still your judgment call, informed by better information.

## 6. A real Audit Log page

There's now an **Audit Log** link in the left sidebar. It shows a running history of every approve, decline, hours adjustment, note, and court-order edit — who did it and when, with before/after details you can expand. This existed behind the scenes before, but there was no page to actually look at it. Now there is, in case you (or anyone) ever needs to show exactly what happened and why on a given case.

## What did NOT change

- Nothing in the volunteer-facing mobile app changed. Volunteers won't see or notice any of this.
- No session gets auto-approved or auto-declined by any of this.
- No new photo or location data is being collected — everything above works from information the app already gathers.
