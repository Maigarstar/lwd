/**
 * Status badge component for pages
 */

const PageStatusBadge = ({ status, C }) => {
  const statusMap = {
    draft: { label: "Draft", bgColor: C.blue, textColor: "#fff" },
    published: { label: "Published", bgColor: C.green, textColor: "#fff" },
    scheduled: { label: "Scheduled", bgColor: C.blue, textColor: "#fff" },
    archived: { label: "Archived", bgColor: C.grey2, textColor: "#fff" }
  };

  const config = statusMap[status] || statusMap.draft;

  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 10px",
        borderRadius: 3,
        backgroundColor: config.bgColor,
        color: config.textColor,
        fontSize: 10,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.05em"
      }}
    >
      {config.label}
    </span>
  );
};

export default PageStatusBadge;
