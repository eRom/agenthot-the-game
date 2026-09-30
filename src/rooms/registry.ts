// Registre des salles : ajouter une salle = un module + une ligne ici (spec section 9.1).
import { room01 } from "./room-01-datacenter";
import room01Thumbnail from "./thumbnails/room-01.webp";
import room02Thumbnail from "./thumbnails/room-02.webp";
import type { RoomEntry } from "./types";

export const ROOMS: readonly RoomEntry[] = [
  { id: room01.id, title: room01.title, status: "playable", definition: room01, thumbnail: room01Thumbnail },
  { id: "room-02", title: "Salle 2", status: "locked", thumbnail: room02Thumbnail },
];

export function findRoom(id: string): RoomEntry | undefined {
  return ROOMS.find((room) => room.id === id);
}
