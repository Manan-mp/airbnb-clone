import { BookingPage } from "@/components/booking/BookingPage";

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BookingPage id={id} />;
}
