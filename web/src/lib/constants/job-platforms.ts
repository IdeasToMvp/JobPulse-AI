import {
  Bolt,
  Building2,
  CheckCircle2,
  DoorOpen,
  Handshake,
  Rocket,
  Send,
  UserSearch,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface JobPlatform {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const jobPlatforms: JobPlatform[] = [
  { id: "linkedin", label: "LinkedIn", icon: Users },
  { id: "naukri", label: "Naukri", icon: Send },
  { id: "indeed", label: "Indeed", icon: CheckCircle2 },
  { id: "instahyre", label: "Instahyre", icon: Bolt },
  { id: "wellfound", label: "Wellfound", icon: Rocket },
  { id: "foundit", label: "Foundit", icon: UserSearch },
  { id: "glassdoor", label: "Glassdoor", icon: DoorOpen },
  { id: "career_pages", label: "Career Pages", icon: Building2 },
  { id: "referrals", label: "Referrals", icon: Handshake },
];
