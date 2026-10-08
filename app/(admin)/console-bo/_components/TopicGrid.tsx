"use client";

import { AG_GRID_LOCALE_FR } from "@ag-grid-community/locale";
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type ColDef,
  type ColGroupDef,
  type ICellRendererParams,
  type IHeaderParams,
  type PostSortRowsParams,
  type ValueFormatterParams,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useMemo, useState } from "react";
import styles from "../admin.module.css";

ModuleRegistry.registerModules([AllCommunityModule]);

/** The site's palette (globals.css) on AG Grid's default theme. */
const theme = themeQuartz.withParams({
  fontFamily: "inherit",
  fontSize: 14,
  accentColor: "var(--green)",
  foregroundColor: "var(--ink)",
  borderColor: "var(--line-light)",
  headerBackgroundColor: "#f7faf8",
  oddRowBackgroundColor: "#fff",
  rowHoverColor: "var(--page)",
  wrapperBorderRadius: 6,
  spacing: 6,
});

export interface TopicGridColumn {
  field: string;
  /** French name, shown first. */
  header: string;
  /** The column in the database, shown under it. */
  column: string;
  kind?: "code" | "text" | "bool" | "lines";
  /** For "lines": codes rather than names. */
  mono?: boolean;
  /** For "lines": how many to show before « + N autres ». */
  maxLines?: number;
}

export interface TopicGridRow {
  id: string;
  values: Record<string, string | boolean | string[] | null>;
  listCode: string | null;
  topics: { code: string; isActive: boolean }[];
}

export interface TopicGridText {
  ownGroup: string;
  topicGroup: string;
  list: string;
  topic: string;
  active: string;
  count: string;
  countOne: string;
  emptyList: string;
  none: string;
  more: string;
  moreOne: string;
  expandAll: string;
  collapseAll: string;
  exportCsv: string;
  rows: string;
  rowsOne: string;
  empty: string;
}

/**
 * One table of the Questionnaire page: the row's own columns, then its topic
 * list. A row opens on its topics, one per line (AG Grid Community has no
 * row grouping: the topic lines are rows of their own, kept under their row
 * when sorting). A filter on a topic code keeps the rows whose list holds it.
 */
export function TopicGrid({
  columns,
  rows,
  text,
  csvName,
}: {
  columns: TopicGridColumn[];
  rows: TopicGridRow[];
  text: TopicGridText;
  csvName: string;
}) {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const expandable = rows.filter((r) => r.topics.length > 0);
  const allOpen = expandable.length > 0 && expandable.every((r) => open.has(r.id));

  const rowData = useMemo(
    () =>
      rows.flatMap((r) => {
        const parent: GridLine = {
          ...r.values,
          lineId: r.id,
          parentId: r.id,
          child: false,
          listCode: r.listCode,
          topicCode: r.topics.map((t) => t.code).join(" "),
          topicCount: r.topics.length,
          isActive: null,
          position: -1,
        };
        if (!open.has(r.id)) return [parent];
        return [
          parent,
          ...r.topics.map(
            (t, position): GridLine => ({
              ...r.values,
              lineId: `${r.id}/${t.code}`,
              parentId: r.id,
              child: true,
              listCode: r.listCode,
              topicCode: t.code,
              topicCount: 0,
              isActive: t.isActive,
              position,
            }),
          ),
        ];
      }),
    [rows, open],
  );

  const columnDefs = useMemo<ColGroupDef<GridLine>[]>(() => {
    const hideOnChild = (format: (p: ValueFormatterParams<GridLine>) => string) => (p: ValueFormatterParams<GridLine>) =>
      p.data?.child ? "" : format(p);
    const own = columns.map((c, i): ColDef<GridLine> => {
      const def: ColDef<GridLine> = {
        field: c.field as keyof GridLine & string,
        headerName: c.header,
        headerComponentParams: { innerHeaderComponent: Header, innerHeaderComponentParams: { dbColumn: c.column } },
        cellDataType: false,
        cellClass: c.kind === "text" || (c.kind === "lines" && !c.mono) ? styles.gridWrap : `${styles.gridCode} ${styles.gridWrap}`,
        wrapText: true,
        autoHeight: true,
      };
      if (i === 0) {
        def.cellRenderer = (p: ICellRendererParams<GridLine>) => {
          const line = p.data;
          if (!line || line.child) return null;
          if (line.topicCount === 0) return <span className={styles.gridToggleSpace}>{breakable(String(p.value))}</span>;
          const isOpen = open.has(line.parentId);
          return (
            <button
              type="button"
              className={styles.gridToggle}
              aria-expanded={isOpen}
              onClick={() =>
                setOpen((prev) => {
                  const next = new Set(prev);
                  if (isOpen) next.delete(line.parentId);
                  else next.add(line.parentId);
                  return next;
                })
              }
            >
              <span aria-hidden="true">{isOpen ? "▾" : "▸"}</span>
              <span>{breakable(String(p.value))}</span>
            </button>
          );
        };
        def.minWidth = 190;
        def.flex = 1.3;
      } else if (c.kind === "bool") {
        def.valueFormatter = hideOnChild((p) => (p.value ? "true" : "false"));
        def.filterValueGetter = (p) => (p.data?.[c.field as keyof GridLine] ? "true" : "false");
        def.minWidth = 110;
        def.flex = 0.7;
      } else if (c.kind === "lines") {
        const max = c.maxLines ?? 3;
        def.autoHeight = true;
        def.wrapText = true;
        def.filterValueGetter = (p) => ((p.data?.[c.field as keyof GridLine] as string[] | undefined) ?? []).join(" ");
        def.comparator = (a: string[], b: string[]) => (a?.length ?? 0) - (b?.length ?? 0);
        def.cellRenderer = (p: ICellRendererParams<GridLine>) => {
          const values = (p.value as string[] | undefined) ?? [];
          if (p.data?.child) return null;
          if (values.length === 0) return <span className={styles.gridMuted}>{text.none}</span>;
          const rest = values.length - max;
          return (
            <span className={styles.gridLines} title={values.join("\n")}>
              {values.slice(0, max).map((v) => (
                <span key={v}>{v}</span>
              ))}
              {rest > 0 && (
                <span className={styles.gridMuted}>{(rest === 1 ? text.moreOne : text.more).replace("{n}", String(rest))}</span>
              )}
            </span>
          );
        };
        def.minWidth = 150;
      } else {
        def.valueFormatter = hideOnChild((p) => (p.value ?? "") as string);
        if (c.kind === "text") {
          def.wrapText = true;
          def.autoHeight = true;
          def.minWidth = 140;
        }
      }
      return def;
    });
    const topic: ColDef<GridLine>[] = [
      {
        field: "listCode",
        headerName: text.list,
        headerComponentParams: { innerHeaderComponent: Header, innerHeaderComponentParams: { dbColumn: "topic_set.code" } },
        cellDataType: false,
        cellClass: `${styles.gridCode} ${styles.gridWrap} ${styles.gridGroupStart}`,
        wrapText: true,
        autoHeight: true,
        valueFormatter: (p) => (p.data?.child ? "" : (p.value ?? "NULL").replaceAll("_", "_\u200b")),
        cellClassRules: { [styles.gridMuted]: (p) => !p.data?.child && p.value == null },
        headerClass: styles.gridGroupStart,
        minWidth: 130,
      },
      {
        field: "topicCode",
        headerName: text.topic,
        headerComponentParams: { innerHeaderComponent: Header, innerHeaderComponentParams: { dbColumn: "topic.code" } },
        cellDataType: false,
        cellClass: `${styles.gridCode} ${styles.gridWrap}`,
        minWidth: 130,
        valueFormatter: (p) => {
          const line = p.data;
          if (!line || line.child) return p.value ?? "";
          if (line.listCode == null) return "";
          if (line.topicCount === 0) return text.emptyList;
          return (line.topicCount === 1 ? text.countOne : text.count).replace("{n}", String(line.topicCount));
        },
        comparator: (_a, _b, nodeA, nodeB) => (nodeA.data?.topicCount ?? 0) - (nodeB.data?.topicCount ?? 0),
      },
      {
        field: "isActive",
        headerName: text.active,
        headerComponentParams: { innerHeaderComponent: Header, innerHeaderComponentParams: { dbColumn: "topic.is_active" } },
        cellDataType: false,
        cellClass: `${styles.gridCode} ${styles.gridWrap}`,
        valueFormatter: (p) => (p.value == null ? "" : p.value ? "true" : "false"),
        filterValueGetter: (p) => (p.data?.isActive == null ? "" : String(p.data.isActive)),
        minWidth: 90,
        flex: 0.6,
      },
    ];
    return [
      { headerName: text.ownGroup, children: own },
      { headerName: text.topicGroup, headerClass: styles.gridGroupStart, children: topic },
    ];
  }, [columns, open, text]);

  /** Sorting moves the rows: each one's topic lines follow it, in list order. */
  const postSortRows = (params: PostSortRowsParams<GridLine>) => {
    const nodes = params.nodes;
    const children = new Map<string, typeof nodes>();
    for (const n of nodes) {
      if (n.data?.child) children.set(n.data.parentId, [...(children.get(n.data.parentId) ?? []), n]);
    }
    const sorted = nodes.filter((n) => !n.data?.child).flatMap((n) => [n, ...(children.get(n.data!.parentId) ?? []).sort((a, b) => a.data!.position - b.data!.position)]);
    nodes.splice(0, nodes.length, ...sorted);
  };

  const exportCsv = () => {
    const header = [...columns.map((c) => c.column), "topic_set.code", "topic.code", "topic.is_active"];
    const cell = (v: unknown) => {
      const s = Array.isArray(v) ? v.join(", ") : v == null ? "" : String(v);
      return /[";\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
    };
    const lines = rows.flatMap((r) => {
      const own = columns.map((c) => cell(r.values[c.field]));
      if (r.topics.length === 0) return [[...own, cell(r.listCode), "", ""].join(";")];
      return r.topics.map((t) => [...own, cell(r.listCode), t.code, String(t.isActive)].join(";"));
    });
    const blob = new Blob([`﻿${[header.join(";"), ...lines].join("\n")}`], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = csvName;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  };

  if (rows.length === 0) return <p className={styles.empty}>{text.empty}</p>;

  return (
    <div className={styles.grid}>
      <div className={styles.gridBar}>
        <span>{rows.length === 1 ? text.rowsOne : text.rows.replace("{n}", String(rows.length))}</span>
        <div className={styles.row}>
          {expandable.length > 0 && (
            <button
              type="button"
              className={styles.gridButton}
              onClick={() => setOpen(allOpen ? new Set() : new Set(expandable.map((r) => r.id)))}
            >
              {allOpen ? text.collapseAll : text.expandAll}
            </button>
          )}
          <button type="button" className={styles.gridButton} onClick={exportCsv}>
            {text.exportCsv}
          </button>
        </div>
      </div>
      <AgGridReact<GridLine>
        theme={theme}
        localeText={AG_GRID_LOCALE_FR}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={{ filter: "agTextColumnFilter", floatingFilter: true, flex: 1, minWidth: 100, autoHeaderHeight: true, wrapHeaderText: true, suppressMovable: true }}
        getRowId={(p) => p.data.lineId}
        getRowClass={(p) => (p.data?.child ? undefined : styles.gridParent)}
        postSortRows={postSortRows}
        domLayout="autoHeight"
        suppressCellFocus
        accentedSort
        enableCellTextSelection
      />
    </div>
  );
}

interface GridLine {
  [field: string]: string | boolean | string[] | number | null;
  lineId: string;
  parentId: string;
  child: boolean;
  listCode: string | null;
  topicCode: string;
  topicCount: number;
  isActive: boolean | null;
  position: number;
}

/** A code that may break after its underscores and dots. */
function breakable(code: string) {
  const parts = code.split(/(?<=[_.])/);
  return parts.flatMap((part, i) => (i < parts.length - 1 ? [part, <wbr key={i} />] : [part]));
}

/** French name, then the database column. */
function Header(params: IHeaderParams & { dbColumn: string }) {
  return (
    <span className={styles.gridHeader}>
      <strong>{params.displayName}</strong>
      <code>{breakable(params.dbColumn)}</code>
    </span>
  );
}
