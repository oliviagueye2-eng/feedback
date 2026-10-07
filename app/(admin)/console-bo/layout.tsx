import type { Metadata } from "next";
import { getDictionary } from "../../_i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { admin } = await getDictionary();
  // Never in search engines.
  return { title: `${admin.title} | ${admin.brand}`, robots: { index: false, follow: false } };
}

/** Every back-office page, sign-in included: the tricolour band on top. */
export default function AdminLayout({ children }: LayoutProps<"/console-bo">) {
  return (
    <>
      <div className="flag" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      {children}
    </>
  );
}
