import { Divider, Table, TableBody, TableHeader } from '@heroui/react';
import { useState } from 'react';

import DefaultLayout from '@/layouts/default.tsx';
import { title } from '@/components/primitives.ts';

export default function SetsPage() {
  const [data, setData] = useState<any | null>(null);

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="inline-block max-w-lg text-center justify-center">
          <h1 className={title()}>Sets</h1>
        </div>
        <Divider />
        <Table>
          <TableHeader />
          <TableBody />
        </Table>
      </section>
    </DefaultLayout>
  );
}
