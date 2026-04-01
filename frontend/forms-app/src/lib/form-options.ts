export const DESIGNATION_OPTIONS = [
  "Assistant Professor",
  "Associate Professor",
  "Professor",
] as const;

export const STUDENT_DEPARTMENT_OPTIONS = [
  "Aero",
  "Auto",
  "Agri",
  "AIML",
  "AIDS",
  "BME",
  "Civil",
  "CSE",
  "CST",
  "CSD",
  "CSE - IoT",
  "ECE",
  "EEE",
  "FT",
  "IT",
  "Mech",
  "MCT",
  "MMCT",
  "MBA",
  "MCA",
  "others",
] as const;

export const FACULTY_DEPARTMENT_OPTIONS = [
  ...STUDENT_DEPARTMENT_OPTIONS,
  "S&H - English",
  "S&H - Physics",
  "S&H - Chemistry",
  "S&H - Mathematics",
] as const;

export const YEAR_OF_STUDY_OPTIONS = ["I", "II", "III", "IV"] as const;
