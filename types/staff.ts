import { StaffRole } from "@/generated/prisma/enums";

type StoreRow = { id: number; name: string };
type StaffNameRow = { displayName: string };
type StoreCreateInput = { name: string };

type StaffCreateInput = { displayName: string; role: StaffRole; storeId: number };

export type StaffImportDbClient = {
  store: {
    findMany: (args: { select: { id: true; name: true } }) => Promise<StoreRow[]>;
    create: (args: { data: StoreCreateInput }) => Promise<StoreRow>;
  };
  staff: {
    findMany: (args: {
      where: { storeId: number };
      select: { displayName: true };
    }) => Promise<StaffNameRow[]>;
    create: (args: { data: StaffCreateInput }) => Promise<unknown>;
  };
};
