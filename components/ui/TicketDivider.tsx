export function TicketDivider() {
  return (
    <div className="ticket-divider my-7" role="presentation">
      {Array.from({ length: 7 }).map((_, i) => (
        <span key={i} className="h-1.5 w-1.5 rounded-full border-2 border-line-strong bg-pitch" />
      ))}
    </div>
  );
}
