/*
TimescaleDB 'apex_log' table schema

CREATE TABLE apex_log (
	time          timestamptz NOT NULL,
	trace_id      varchar(40) NOT NULL,
	headers       text        NOT NULL,
	body          text        NULL,
	status_code   integer     NULL
);
ALTER TABLE apex_log ADD CONSTRAINT valid_status CHECK (status_code > 99 AND status_code < 600);

Timescale insert statement, configured with object

'INSERT INTO apex_log VALUES (NOW(), ${trace_id}, ${headers}, #{body}, #{status_code})', {
	trace_id: '89678a1c-6f80-11ea-bc55-0242ac130003',
	headers: 'test headers',
	body: 'test body from config object'
	status_code: 900
}
*/