import React from 'react';

export const StatusBadge = ({ status }) => {
  const norm = (status || '').toUpperCase();

  let badgeClass = 'badge-blue';
  if (norm === 'VERIFIED' || norm === 'SOLD' || norm === 'CLEAR' || norm === 'PAID' || norm === 'ALL TRACKED') {
    badgeClass = 'badge-green';
  } else if (norm === 'PENDING' || norm === 'TAG PENDING' || norm === 'LOW STOCK' || norm === 'PARTIAL') {
    badgeClass = 'badge-amber';
  } else if (norm === 'CANCELLED' || norm === 'ALERT' || norm === 'RETURNED' || norm === 'OVERDUE') {
    badgeClass = 'badge-red';
  }

  return <span className={`badge ${badgeClass}`}>{status}</span>;
};
