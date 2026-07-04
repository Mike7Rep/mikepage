create table "strategy_versions" (
  "id" serial primary key,
  "version" integer not null unique,
  "run_id" integer,
  "strategy_json" jsonb not null,
  "rationale" text not null,
  "created_at" timestamp(3) not null default current_timestamp
);

create index "strategy_versions_run_id_idx" on "strategy_versions"("run_id");
create index "strategy_versions_created_at_idx" on "strategy_versions"("created_at");

alter table "strategy_versions"
  add constraint "strategy_versions_run_id_fkey"
  foreign key ("run_id") references "runs"("id")
  on delete set null on update cascade;
