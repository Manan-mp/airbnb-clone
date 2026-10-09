import { EditListing } from "@/components/host/EditListing";

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditListing id={id} />;
}
