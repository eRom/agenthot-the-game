// Registre des salles : ajouter une salle = un module + une ligne ici (spec section 9.1).
import { room01 } from "./room-01-datacenter";
import type { RoomEntry } from "./types";

export const ROOMS: readonly RoomEntry[] = [
  { id: room01.id, title: room01.title, status: "playable", definition: room01, thumbnail: "/rooms/room-01.webp" },
  { id: "room-02", title: "Salle 2", status: "locked", thumbnail: "/rooms/room-02.webp" },
];

export function findRoom(id: string): RoomEntry | undefined {
  return ROOMS.find((room) => room.id === id);
}
