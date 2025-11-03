
import * as React from 'react';
import { AssetDetail } from '@/components/asset-detail';

export default function AssetDetailPage({ params }: { params: { id: string } }) {
    return <AssetDetail assetId={params.id} />;
}
