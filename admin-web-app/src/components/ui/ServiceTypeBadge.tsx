/** Shows a volunteer's account-level service-type classification next to their name. */
export function ServiceTypeBadge({
  serviceType,
  className = "",
}: {
  serviceType: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-sm border font-data text-[12px] font-semibold leading-[16px] whitespace-nowrap bg-[#f2f0e8] text-[#4a4536] border-[#a89f83] ${className}`}
    >
      {serviceType}
    </span>
  );
}
