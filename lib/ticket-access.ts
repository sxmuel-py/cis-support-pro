import { TicketCategory, UserRole } from "@/lib/types";

export function canAccessTicketCategory(
  role: UserRole | null | undefined,
  category: TicketCategory | string | null | undefined
) {
  if (!role || !category) {
    return false;
  }

  if (role === "sims_manager") {
    return category === "sims";
  }

  if (role === "technician") {
    return category !== "sims";
  }

  return true;
}

export function isIndividualContributorRole(role: UserRole | null | undefined) {
  return role === "technician" || role === "sims_manager";
}
