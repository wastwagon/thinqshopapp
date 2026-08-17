'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import FormField from '@/components/ui/FormField';
import Button from '@/components/ui/Button';

const guestShippingSchema = z.object({
    guest_email: z
        .string()
        .trim()
        .refine((val) => val === '' || z.string().email().safeParse(val).success, {
            message: 'Enter a valid email',
        }),
    full_name: z.string().min(1, 'Full name is required'),
    phone: z.string().min(10, 'Phone must be at least 10 characters'),
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    region: z.string().min(1, 'Region is required'),
    landmark: z.string().optional(),
});

export type GuestShippingFormData = z.infer<typeof guestShippingSchema>;

type GuestShippingFormProps = {
    defaultValues?: Partial<GuestShippingFormData>;
    onSubmit: (data: GuestShippingFormData) => void;
};

export default function GuestShippingForm({ defaultValues, onSubmit }: GuestShippingFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<GuestShippingFormData>({
        resolver: zodResolver(guestShippingSchema),
        defaultValues,
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField
                    label="Email (optional)"
                    htmlFor="guest-email"
                    hint="Add it if you want a receipt. You can track with your order number."
                    error={errors.guest_email?.message}
                    className="md:col-span-2"
                >
                    <Input
                        id="guest-email"
                        type="email"
                        autoComplete="email"
                        {...register('guest_email')}
                        invalid={!!errors.guest_email}
                    />
                </FormField>
                <FormField label="Full name" htmlFor="guest-name" error={errors.full_name?.message}>
                    <Input id="guest-name" autoComplete="name" {...register('full_name')} invalid={!!errors.full_name} />
                </FormField>
                <FormField label="Phone number" htmlFor="guest-phone" error={errors.phone?.message}>
                    <Input id="guest-phone" autoComplete="tel" {...register('phone')} invalid={!!errors.phone} />
                </FormField>
                <FormField
                    label="Delivery address / street"
                    htmlFor="guest-street"
                    error={errors.street?.message}
                    className="md:col-span-2"
                >
                    <Input id="guest-street" autoComplete="street-address" {...register('street')} invalid={!!errors.street} />
                </FormField>
                <FormField label="City / town" htmlFor="guest-city" error={errors.city?.message}>
                    <Input id="guest-city" autoComplete="address-level2" {...register('city')} invalid={!!errors.city} />
                </FormField>
                <FormField label="Region" htmlFor="guest-region" error={errors.region?.message}>
                    <Select id="guest-region" {...register('region')} invalid={!!errors.region}>
                        <option value="">Select Region</option>
                        <option value="Greater Accra">Greater Accra</option>
                        <option value="Ashanti">Ashanti</option>
                        <option value="Central">Central</option>
                        <option value="Eastern">Eastern</option>
                        <option value="Western">Western</option>
                    </Select>
                </FormField>
                <FormField label="Landmark (optional)" htmlFor="guest-landmark" className="md:col-span-2">
                    <Input id="guest-landmark" {...register('landmark')} />
                </FormField>
            </div>
            <div className="flex justify-end">
                <Button type="submit" variant="primary">
                    Proceed to Payment
                </Button>
            </div>
        </form>
    );
}
