# How to Fix Exotel Caller ID Showing "PW" on Truecaller

## 1. Why is the Number Showing "PW"?

In India, cloud telephony providers like **Exotel** lease blocks of Virtual Numbers (ExoPhones, often starting with `080...`). 
Many of these virtual numbers were previously leased to large educational and commercial enterprises like **Physics Wallah ("PW")** for admission outreach, student counseling, and OTP verification.

Because millions of Truecaller users received calls from that number and tagged it as **"PW"** or **"Physics Wallah"**, Truecaller's crowdsourced database mapped that virtual phone number to "PW". When your ResQRoute emergency voice call rings a contact, Truecaller displays "PW", causing contacts to mistake a critical emergency alert for sales/coaching spam!

---

## 2. Solutions to Fix & Change the Display Name

### Solution A: Register on "Truecaller for Business" (Recommended for Production)
Truecaller allows verified businesses to override all crowdsourced user tags with a permanent, verified brand profile:

1. Visit [Truecaller for Business](https://business.truecaller.com/).
2. Create an account and register your Exotel virtual number (`080XXXXXXXX`).
3. Set Business Name: **`ResQRoute Emergency Response`** or **`ResQRoute Rescue Dispatch`**.
4. Set Category: **Emergency & Healthcare / Roadside Assistance**.
5. Upload the ResQRoute logo.
6. Once verified (usually 24–48 hours), Truecaller displays:
   - **Green Caller ID Screen** (Verified Business Badge)
   - Call Reason: *"Emergency SOS Alert for your contact"*
   - Priority Call indicator.

---

### Solution B: Request a Fresh ExoPhone from Exotel Console
If you are on an Exotel plan:
1. Log in to your [Exotel Dashboard](https://my.exotel.com).
2. Go to **ExoPhones** -> **Buy Numbers**.
3. Choose a fresh, unallocated number (preferably a mobile-style 10-digit number or a fresh 080/011 series).
4. Update `EXOTEL_CALLER_ID` in your Supabase Edge Function secrets:
   ```bash
   supabase secrets set EXOTEL_CALLER_ID="YOUR_NEW_EXOPHONE_NUMBER"
   ```

---

### Solution C: Submit a Name Correction on Truecaller
For testing or immediate temporary relief:
1. Open the **Truecaller App** on any mobile phone.
2. Search for the Exotel number (`08047359243`).
3. Tap the **Edit / Suggest Name** icon.
4. Enter:
   - First Name: **ResQRoute**
   - Last Name: **Emergency SOS**
   - Category: **Emergency Services**
5. Have 2–3 friends/team members also suggest the same name. Truecaller's algorithmic confidence updates the crowdsourced name within 12–24 hours.

---

### Solution D: Direct Device SIM Dialing (Built into ResQRoute 2.0)
ResQRoute 2.0 now includes a **"Call Directly From Phone"** button in `TrustedContactsScreen.tsx`.
- Initiates an immediate direct cellular call via `tel:` URI.
- The call originates directly from the driver's own mobile SIM card.
- The recipient's phone will display the user's name as already saved in their personal address book (e.g. *"Souradip"*, *"Son"*, *"Brother"*), completely bypassing virtual number spam flags!
