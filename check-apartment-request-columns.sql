select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'apartment_requests'
  and column_name in (
    'request_status',
    'assigned_scout_name',
    'assigned_scout_phone',
    'latest_update',
    'admin_notes',
    'search_started_at',
    'search_expires_at',
    'extension_expires_at',
    'completed_at',
    'extended_at'
  )
order by ordinal_position;
