export * as PeyflexAirtime from "./airtime.service";
export * as PeyflexData from "./data.service";
export * as PeyflexCable from "./cable.service";
export * as PeyflexElectricity from "./electricity.service";
export * as PeyflexBetting from "./betting.service";
export * as PeyflexEducation from "./education.service";
export * as PeyflexRechargeCard from "./rechargeCard.service";
export * as PeyflexVirtualNumber from "./virtualNumber.service"; // OTP endpoints
export * as PeyflexAccount from "./account.service";

// Full Peyflex API surface implemented — every section from the docs
// (Airtime, Data, Cable TV, Electricity, Fund Betting, Education,
// Recharge Card, Virtual Number/OTP) is covered.
//
// Remaining unconfirmed details (won't block usage, but verify before
// relying on them for anything beyond the fields listed):
//   - Data purchase response shape beyond {status, reference, message}
//   - Cable verify response fields beyond {status, customer_name, message}
//   - Cable/Electricity subscribe response shapes beyond {status, message, reference}
//   - Education purchase response fields beyond {status, reference, amount}
//   - User profile response shape (endpoint confirmed, body never captured)
