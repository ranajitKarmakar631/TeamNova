import { TeamStatusEnumType } from "@/constant";
import { PaginationType } from "@/features/project/types/project.types";

export type TeamType = {
  _id: string;
  name: string;
  slug?: string;
  description?: string | null;
  workspaceId: string;
  projectId?:
    | string
    | {
        _id: string;
        name: string;
        emoji?: string;
        description?: string | null;
      }
    | null;
  status: TeamStatusEnumType;
  createdBy?: {
    _id: string;
    name: string;
    email?: string;
    profilePicture?: string | null;
  } | null;
  membersCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type AllTeamsPayloadType = {
  workspaceId: string;
  keyword?: string | null;
  status?: string | null;
  projectId?: string | null;
  pageNumber?: number | null;
  pageSize?: number | null;
  onlyMyTeams?: boolean;
};

export type AllTeamsResponseType = {
  message: string;
  teams: TeamType[];
  pagination: PaginationType;
};

export type CreateTeamPayloadType = {
  workspaceId: string;
  data: {
    name: string;
    projectId?: string;
    description?: string;
    status?: TeamStatusEnumType;
  };
};

export type EditTeamPayloadType = {
  workspaceId: string;
  teamId: string;
  data: Partial<{
    name: string;
    description?: string;
    status?: TeamStatusEnumType;
  }>;
};

export type TeamResponseType = {
  message: string;
  team: TeamType;
};

