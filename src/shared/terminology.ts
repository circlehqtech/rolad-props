import { useAuthStore } from "../store/authStore";

/**
 * Custom hook to dynamically translate user interface labels according to 
 * organization terminology overrides configured on the backend.
 * @param label The default label code/string to map.
 */
export function useTerminology(label: string): string {
  const organization = useAuthStore((state) => state.organization);
  if (!organization || !organization.terminologyOverrides) {
    return label;
  }
  return organization.terminologyOverrides[label] || label;
}
