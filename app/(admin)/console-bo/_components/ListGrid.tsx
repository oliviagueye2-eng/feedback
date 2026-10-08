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

export interface ListGridColumn {
  field: string;
  /** French name, shown first. */
  header: string;
  /** The column in the database, shown beside it; none for a label (asked by Olivia). */
  column?: string;
  kind?: "code" | "text" | "bool" | "lines";
  /** For "lines": codes rather than names. */
  mono?: boolean;
  /** For "lines": how many to show before « + N autres ». */
  maxLines?: number;
  /** For "lines": shown when there is none (default « aucun »). */
  emptyText?: string;
}

/** Columns of the row itself, under one group header. */
export interface OwnGroup {
  kind: "own";
  title: string;
  columns: ListGridColumn[];
}

/**
 * A list the row holds (its topics, its questions, a question's answers),
 * under one group header: the list's code when it has one, then one line per
 * item when the row is open.
 */
export interface ListGroup {
  kind: "list";
  id: string;
  title: string;
  list?: { header: string; column: string };
  item: { header: string; column: string };
  /** Values per item: « Label » (text, no database column), « Actif » (is_active), « Position », « Catégorie ». */
  extras?: { header: string; column?: string; kind: "bool" | "number" | "code" | "text"; emptyText?: string }[];
  /** « {n} thèmes », « 1 thème ». */
  count: string;
  countOne: string;
}

export type ListGridGroup = OwnGroup | ListGroup;

export interface ListGridItem {
  code: string;
  /** Shown under the code (an answer's text). */
  label?: string | null;
  /** One per column of the group's `extras`, in order. */
  extras?: (boolean | number | string | null)[];
}

export interface ListGridRow {
  id: string;
  values: Record<string, string | boolean | string[] | number | null>;
  lists: Record<string, { code?: string | null; items: ListGridItem[] }>;
}

export interface ListGridText {
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

const LIST = (id: string) => `${id}·list`;
const ITEM = (id: string) => `${id}·item`;
const EXTRA = (id: string, n: number) => `${id}·extra${n}`;
const COUNT = (id: string) => `${id}·count`;

/**
 * One table of the Questionnaire page: column groups of the row's own
 * values, and of the lists it holds. A row opens on the items of its lists,
 * one per line, list after list (AG Grid Community has no row grouping: the
 * item lines are rows of their own, kept under their row when sorting). A
 * filter on an item code keeps the rows whose list holds it.
 */
export function ListGrid({
  groups,
  rows,
  text,
  csvName,
}: {
  groups: ListGridGroup[];
  rows: ListGridRow[];
  text: ListGridText;
  csvName: string;
}) {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const lists = groups.filter((g): g is ListGroup => g.kind === "list");
  const own = groups.flatMap((g) => (g.kind === "own" ? g.columns : []));
  const itemCount = (r: ListGridRow) => lists.reduce((n, l) => n + (r.lists[l.id]?.items.length ?? 0), 0);
  const expandable = rows.filter((r) => itemCount(r) > 0);
  const allOpen = expandable.length > 0 && expandable.every((r) => open.has(r.id));

  const rowData = useMemo(
    () =>
      rows.flatMap((r) => {
        const parent: GridLine = { ...r.values, _line: r.id, _parent: r.id, _child: false, _order: -1 };
        for (const l of lists) {
          const content = r.lists[l.id];
          parent[LIST(l.id)] = content?.code ?? null;
          parent[ITEM(l.id)] = (content?.items ?? []).map((i) => i.code).join(" ");
          (l.extras ?? []).forEach((_, n) => (parent[EXTRA(l.id, n)] = null));
          parent[COUNT(l.id)] = content?.items.length ?? 0;
        }
        if (!open.has(r.id)) return [parent];
        let order = 0;
        const children = lists.flatMap((l) =>
          (r.lists[l.id]?.items ?? []).map((item): GridLine => {
            const line: GridLine = { ...r.values, _line: `${r.id}/${l.id}/${item.code}`, _parent: r.id, _child: true, _order: order++ };
            for (const other of lists) {
              const mine = other.id === l.id;
              line[LIST(other.id)] = mine ? (r.lists[l.id]?.code ?? null) : null;
              line[ITEM(other.id)] = mine ? item.code : null;
              (other.extras ?? []).forEach((_, n) => (line[EXTRA(other.id, n)] = mine ? (item.extras?.[n] ?? null) : null));
              line[COUNT(other.id)] = 0;
              if (mine && item.label) line[`${ITEM(other.id)}·label`] = item.label;
            }
            return line;
          }),
        );
        return [parent, ...children];
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lists derives from groups
    [rows, open, groups],
  );

  const columnDefs = useMemo<ColGroupDef<GridLine>[]>(() => {
    const hideOnChild = (format: (p: ValueFormatterParams<GridLine>) => string) => (p: ValueFormatterParams<GridLine>) =>
      p.data?._child ? "" : format(p);
    const header = (dbColumn?: string) => ({ innerHeaderComponent: Header, innerHeaderComponentParams: { dbColumn } });
    const ownColumn = (c: ListGridColumn, groupStart: boolean, first: boolean): ColDef<GridLine> => {
      const def: ColDef<GridLine> = {
        field: c.field,
        headerName: c.header,
        headerComponentParams: header(c.column),
        cellDataType: false,
        cellClass: [
          c.kind === "text" || (c.kind === "lines" && !c.mono) ? styles.gridWrap : `${styles.gridCode} ${styles.gridWrap}`,
          groupStart ? styles.gridGroupStart : "",
        ].join(" "),
        headerClass: groupStart ? styles.gridGroupStart : undefined,
        wrapText: true,
        autoHeight: true,
      };
      if (first) {
        def.cellRenderer = (p: ICellRendererParams<GridLine>) => {
          const line = p.data;
          if (!line || line._child) return null;
          const count = lists.reduce((n, l) => n + Number(line[COUNT(l.id)] ?? 0), 0);
          if (count === 0) return <span className={styles.gridToggleSpace}>{breakable(String(p.value))}</span>;
          const isOpen = open.has(line._parent);
          return (
            <button
              type="button"
              className={styles.gridToggle}
              aria-expanded={isOpen}
              onClick={() =>
                setOpen((prev) => {
                  const next = new Set(prev);
                  if (isOpen) next.delete(line._parent);
                  else next.add(line._parent);
                  return next;
                })
              }
            >
              <span aria-hidden="true">{isOpen ? "▾" : "▸"}</span>
              <span>{breakable(String(p.value))}</span>
            </button>
          );
        };
        def.minWidth = 170;
        def.flex = 1.3;
      } else if (c.kind === "bool") {
        def.valueFormatter = hideOnChild((p) => (p.value ? "true" : "false"));
        def.filterValueGetter = (p) => (p.data?.[c.field] ? "true" : "false");
        def.minWidth = 110;
        def.flex = 0.7;
      } else if (c.kind === "lines") {
        const max = c.maxLines ?? 3;
        def.filterValueGetter = (p) => ((p.data?.[c.field] as string[] | undefined) ?? []).join(" ");
        def.comparator = (a: string[], b: string[]) => (a?.length ?? 0) - (b?.length ?? 0);
        def.cellRenderer = (p: ICellRendererParams<GridLine>) => {
          const values = (p.value as string[] | undefined) ?? [];
          if (p.data?._child) return null;
          if (values.length === 0) return <span className={styles.gridMuted}>{c.emptyText ?? text.none}</span>;
          const rest = values.length - max;
          return (
            <span className={styles.gridLines} title={values.join("\n")}>
              {values.slice(0, max).map((v) => (
                <span key={v}>{c.mono ? breakable(v) : v}</span>
              ))}
              {rest > 0 && (
                <span className={styles.gridMuted}>{(rest === 1 ? text.moreOne : text.more).replace("{n}", String(rest))}</span>
              )}
            </span>
          );
        };
        def.minWidth = 150;
      } else if (c.kind === "text") {
        def.valueFormatter = hideOnChild((p) => (p.value ?? "") as string);
        def.minWidth = 130;
      } else {
        def.cellRenderer = (p: ICellRendererParams<GridLine>) => {
          if (p.data?._child) return null;
          if (p.value == null) return <span className={styles.gridMuted}>NULL</span>;
          return breakable(String(p.value));
        };
        def.minWidth = 100;
      }
      return def;
    };
    const listColumns = (l: ListGroup): ColDef<GridLine>[] => {
      const cols: ColDef<GridLine>[] = [];
      if (l.list) {
        cols.push({
          field: LIST(l.id),
          headerName: l.list.header,
          headerComponentParams: header(l.list.column),
          cellDataType: false,
          cellClass: `${styles.gridCode} ${styles.gridWrap}`,
          wrapText: true,
          autoHeight: true,
          valueFormatter: (p) => (p.data?._child ? "" : (p.value ?? "NULL").replaceAll("_", "_​")),
          cellClassRules: { [styles.gridMuted]: (p) => !p.data?._child && p.value == null },
          minWidth: 130,
        });
      }
      cols.push({
        field: ITEM(l.id),
        headerName: l.item.header,
        headerComponentParams: header(l.item.column),
        cellDataType: false,
        cellClass: `${styles.gridCode} ${styles.gridWrap}`,
        wrapText: true,
        autoHeight: true,
        minWidth: 130,
        cellRenderer: (p: ICellRendererParams<GridLine>) => {
          const line = p.data;
          if (!line) return null;
          if (line._child) {
            if (line[ITEM(l.id)] == null) return null;
            const label = line[`${ITEM(l.id)}·label`];
            return (
              <span className={styles.gridLines}>
                <span>{breakable(String(line[ITEM(l.id)]))}</span>
                {typeof label === "string" && <span className={styles.gridItemLabel}>{label}</span>}
              </span>
            );
          }
          const count = Number(line[COUNT(l.id)] ?? 0);
          if (l.list && line[LIST(l.id)] == null) return null;
          if (count === 0) return <span className={styles.gridMuted}>{text.emptyList}</span>;
          return (count === 1 ? l.countOne : l.count).replace("{n}", String(count));
        },
        comparator: (_a, _b, nodeA, nodeB) => Number(nodeA.data?.[COUNT(l.id)] ?? 0) - Number(nodeB.data?.[COUNT(l.id)] ?? 0),
      });
      (l.extras ?? []).forEach((extra, n) => {
        const field = EXTRA(l.id, n);
        cols.push({
          field,
          headerName: extra.header,
          headerComponentParams: header(extra.column),
          cellDataType: false,
          cellClass: extra.kind === "text" ? styles.gridWrap : `${styles.gridCode} ${styles.gridWrap}`,
          wrapText: true,
          autoHeight: true,
          ...(extra.kind === "code"
            ? {
                cellRenderer: (p: ICellRendererParams<GridLine>) => {
                  if (!p.data?._child || p.data[ITEM(l.id)] == null) return null;
                  if (p.value == null) return <span className={styles.gridMuted}>{extra.emptyText ?? "NULL"}</span>;
                  return breakable(String(p.value));
                },
                minWidth: 120,
              }
            : extra.kind === "text"
              ? { valueFormatter: (p: ValueFormatterParams<GridLine>) => (p.value == null ? "" : String(p.value)), minWidth: 160, flex: 1 }
              : { valueFormatter: (p: ValueFormatterParams<GridLine>) => (p.value == null ? "" : String(p.value)), minWidth: 100, flex: 0.5 }),
          filterValueGetter: (p) => (p.data?.[field] == null ? "" : String(p.data[field])),
        });
      });
      // The group's first column draws its left border.
      cols[0]!.cellClass = `${cols[0]!.cellClass as string} ${styles.gridGroupStart}`;
      cols[0]!.headerClass = styles.gridGroupStart;
      return cols;
    };
    return groups.map((g, i) => ({
      headerName: g.title,
      headerClass: i > 0 ? styles.gridGroupStart : undefined,
      children: g.kind === "own" ? g.columns.map((c, j) => ownColumn(c, i > 0 && j === 0, i === 0 && j === 0)) : listColumns(g),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lists derives from groups
  }, [groups, open, text]);

  /** Sorting moves the rows: each one's item lines follow it, in list order. */
  const postSortRows = (params: PostSortRowsParams<GridLine>) => {
    const nodes = params.nodes;
    const children = new Map<string, typeof nodes>();
    for (const n of nodes) {
      if (n.data?._child) children.set(n.data._parent, [...(children.get(n.data._parent) ?? []), n]);
    }
    const sorted = nodes
      .filter((n) => !n.data?._child)
      .flatMap((n) => [n, ...(children.get(n.data!._parent) ?? []).sort((a, b) => a.data!._order - b.data!._order)]);
    nodes.splice(0, nodes.length, ...sorted);
  };

  /** One line per item; a line fills only its own list's columns. */
  const exportCsv = () => {
    const header = [
      ...own.map((c) => c.column ?? c.field),
      ...lists.flatMap((l) => [...(l.list ? [l.list.column] : []), l.item.column, ...(l.extras ?? []).map((e) => e.column ?? e.header)]),
    ];
    const cell = (v: unknown) => {
      const s = Array.isArray(v) ? v.join(", ") : v == null ? "" : String(v);
      return /[";\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
    };
    const listCells = (r: ListGridRow, only?: { list: ListGroup; item: ListGridItem }) =>
      lists.flatMap((l) => {
        const mine = only?.list.id === l.id;
        return [
          ...(l.list ? [cell(only && !mine ? null : r.lists[l.id]?.code)] : []),
          mine ? cell(only.item.code) : "",
          ...(l.extras ?? []).map((_, n) => (mine ? cell(only.item.extras?.[n]) : "")),
        ];
      });
    const lines = rows.flatMap((r) => {
      const values = own.map((c) => cell(r.values[c.field]));
      if (itemCount(r) === 0) return [[...values, ...listCells(r)].join(";")];
      return lists.flatMap((l) => (r.lists[l.id]?.items ?? []).map((item) => [...values, ...listCells(r, { list: l, item })].join(";")));
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
        defaultColDef={{ filter: "agTextColumnFilter", flex: 1, minWidth: 100, autoHeaderHeight: true, wrapHeaderText: true, suppressMovable: true }}
        getRowId={(p) => p.data._line}
        getRowClass={(p) => (p.data?._child ? undefined : styles.gridParent)}
        postSortRows={postSortRows}
        domLayout="autoHeight"
        suppressCellFocus
        accentedSort
        enableCellTextSelection
      />
    </div>
  );
}

/** Internal fields start with « _ », apart from the rows' own fields (a category has a « position »). */
interface GridLine {
  [field: string]: string | boolean | string[] | number | null;
  _line: string;
  _parent: string;
  _child: boolean;
  _order: number;
}

/** A code that may break after its underscores and dots. */
function breakable(code: string) {
  const parts = code.split(/(?<=[_.])/);
  return parts.flatMap((part, i) => (i < parts.length - 1 ? [part, <wbr key={i} />] : [part]));
}

/** French name, then the database column on the same line (none for a label). */
function Header(params: IHeaderParams & { dbColumn?: string }) {
  return (
    <span className={styles.gridHeader}>
      <strong>{params.displayName}</strong>
      {params.dbColumn && <code>{breakable(params.dbColumn)}</code>}
    </span>
  );
}
