import { BadgeWidget } from '@/components/badge/BadgeWidget';

/** Public, embeddable badge (rendered inside an iframe on a business's site). */
export default function BadgePage({ params }: { params: { bizId: string } }) {
  return <BadgeWidget businessId={Number(params.bizId)} />;
}
