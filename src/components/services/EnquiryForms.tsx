import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n";
import { EnquiryError, sendEnquiry } from "@/lib/emailjs";
import { whatsappHref } from "@/lib/business";
import { track } from "@/lib/analytics";

const PHONE = /^[6-9]\d{9}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Honeypot({ register }: { register: ReturnType<typeof useForm>["register"] }) {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label>
        Website
        <input tabIndex={-1} autoComplete="off" {...register("website")} />
      </label>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? <p role="alert" className="font-hindi text-small text-destructive">{message}</p> : null;
}

function useSubmitter(kind: "contact" | "booking") {
  const { messages } = useI18n();
  const startedAt = useRef(Date.now());
  const [busy, setBusy] = useState(false);
  const copy = messages.forms[kind];

  async function submit(templateId: string | undefined, values: Record<string, string>, onDone: () => void) {
    setBusy(true);
    const { website, ...params } = values;
    try {
      await sendEnquiry(templateId, params, { honeypot: website ?? "", startedAt: startedAt.current });
      track("form_help_click", { from: `${kind}_form`, channel: "email" });
      toast.success(copy.success);
      onDone();
    } catch (error) {
      const code = error instanceof EnquiryError ? error.code : "failed";
      if (code === "spam") {
        toast.success(copy.success);
        onDone();
      } else if (code === "throttled") {
        toast.info("आपका संदेश अभी भेजा गया है। कृपया 1 मिनट बाद दोबारा भेजें।");
      } else {
        toast.error(copy.error, {
          action: { label: "WhatsApp करें", onClick: () => window.open(whatsappHref(params.message ?? ""), "_blank", "noopener") },
        });
      }
    } finally {
      setBusy(false);
    }
  }
  return { busy, submit, copy };
}

interface ContactValues {
  name: string;
  phone: string;
  email: string;
  service: string;
  message: string;
  website: string;
}

export function ContactForm() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactValues>();
  const { busy, submit } = useSubmitter("contact");
  const { messages } = useI18n();
  const c = messages.forms.contact;

  return (
    <form
      onSubmit={handleSubmit((values) => void submit(import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined, { ...values }, () => reset()))}
      className="relative space-y-4"
      noValidate
    >
      <Honeypot register={register as never} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="c-name" className="font-hindi">{c.placeholders.name}</Label>
          <Input id="c-name" autoComplete="name" className="h-11 font-hindi" {...register("name", { required: c.validation.name, maxLength: 80 })} />
          <FieldError message={errors.name?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-phone" className="font-hindi">{c.placeholders.phone}</Label>
          <Input id="c-phone" type="tel" inputMode="numeric" autoComplete="tel-national" className="h-11" {...register("phone", { required: c.validation.phone, pattern: { value: PHONE, message: c.validation.phonePattern } })} />
          <FieldError message={errors.phone?.message} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="c-email" className="font-hindi">{c.placeholders.email}</Label>
          <Input id="c-email" type="email" autoComplete="email" className="h-11" {...register("email", { pattern: { value: EMAIL, message: c.validation.emailPattern } })} />
          <FieldError message={errors.email?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-service" className="font-hindi">{c.placeholders.service}</Label>
          <Input id="c-service" className="h-11 font-hindi" {...register("service", { required: c.validation.service, maxLength: 120 })} />
          <FieldError message={errors.service?.message} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="c-message" className="font-hindi">{c.placeholders.message}</Label>
        <Textarea id="c-message" rows={4} className="font-hindi" {...register("message", { required: c.validation.message, maxLength: 2000 })} />
        <FieldError message={errors.message?.message} />
      </div>
      <Button type="submit" size="lg" disabled={busy} className="w-full font-hindi sm:w-auto">{busy ? c.submitting : c.submit}</Button>
    </form>
  );
}

interface BookingValues {
  name: string;
  phone: string;
  email: string;
  sessionType: string;
  date: string;
  message: string;
  website: string;
}

export function BookingForm() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<BookingValues>();
  const { busy, submit } = useSubmitter("booking");
  const { messages } = useI18n();
  const b = messages.forms.booking;

  return (
    <form
      onSubmit={handleSubmit((values) => void submit(import.meta.env.VITE_EMAILJS_TEMPLATE_ID_MATAJI_STUDIO as string | undefined, { ...values }, () => reset()))}
      className="relative space-y-4"
      noValidate
    >
      <Honeypot register={register as never} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="b-name" className="font-hindi">{b.labels.name}</Label>
          <Input id="b-name" autoComplete="name" placeholder={b.placeholders.name} className="h-11 font-hindi" {...register("name", { required: b.validation.name, maxLength: 80 })} />
          <FieldError message={errors.name?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="b-phone" className="font-hindi">{b.labels.phone}</Label>
          <Input id="b-phone" type="tel" inputMode="numeric" placeholder={b.placeholders.phone} className="h-11" {...register("phone", { required: b.validation.phone, pattern: { value: PHONE, message: b.validation.phonePattern } })} />
          <FieldError message={errors.phone?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="b-session" className="font-hindi">{b.labels.sessionType}</Label>
          <select id="b-session" className="h-11 w-full rounded-xl border bg-card px-3 font-hindi" defaultValue="" {...register("sessionType", { required: b.validation.sessionType })}>
            <option value="" disabled>{b.placeholders.sessionType}</option>
            {b.options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <FieldError message={errors.sessionType?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="b-date" className="font-hindi">{b.labels.date}</Label>
          <Input id="b-date" type="date" className="h-11" {...register("date", { required: b.validation.date })} />
          <FieldError message={errors.date?.message} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="b-email" className="font-hindi">{b.labels.email}</Label>
        <Input id="b-email" type="email" placeholder={b.placeholders.email} className="h-11" {...register("email", { pattern: { value: EMAIL, message: b.validation.emailPattern } })} />
        <FieldError message={errors.email?.message} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="b-message" className="font-hindi">{b.labels.message}</Label>
        <Textarea id="b-message" rows={3} placeholder={b.placeholders.message} className="font-hindi" {...register("message", { maxLength: 2000 })} />
      </div>
      <Button type="submit" size="lg" disabled={busy} className="w-full font-hindi sm:w-auto">{busy ? b.submitting : b.submit}</Button>
    </form>
  );
}
