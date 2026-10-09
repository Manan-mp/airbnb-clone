import { ListingPage } from "@/components/listing/ListingPage";

export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ListingPage id={id} />;
}
