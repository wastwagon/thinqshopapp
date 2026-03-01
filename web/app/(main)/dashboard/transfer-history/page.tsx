import { redirect } from 'next/navigation';

export default function TransferHistoryRedirect() {
    redirect('/dashboard/transfers');
}
