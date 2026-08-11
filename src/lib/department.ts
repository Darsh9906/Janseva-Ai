export const DEPARTMENTS = [
  "Road Maintenance",
  "Water Works",
  "Electrical / Street Lighting",
  "Sanitation",
  "Public Safety Cell",
  "General Works",
] as const;

export type Department = (typeof DEPARTMENTS)[number];

const ROUTING: Record<string, Department> = {
  Pothole: "Road Maintenance",
  "Road Damage": "Road Maintenance",
  "Water Leakage": "Water Works",
  Drainage: "Water Works",
  Streetlight: "Electrical / Street Lighting",
  "Waste Management": "Sanitation",
  "Public Safety": "Public Safety Cell",
  Other: "General Works",
};

export function departmentForCategory(category: string): Department {
  return ROUTING[category] ?? "General Works";
}
