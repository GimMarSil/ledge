import { TreasuryAccount } from "@/prisma/client"
import { SelectProps } from "@radix-ui/react-select"
import { FormSelect } from "./simple"

export const FormSelectTreasuryAccount = ({
  title,
  accounts,
  emptyValue,
  placeholder,
  hideIfEmpty = false,
  isRequired = false,
  ...props
}: {
  title: string
  accounts: TreasuryAccount[]
  emptyValue?: string
  placeholder?: string
  hideIfEmpty?: boolean
  isRequired?: boolean
} & SelectProps) => {
  return (
    <FormSelect
      title={title}
      items={accounts.map((a) => ({
        code: a.code,
        name: a.type === "personal" ? `${a.name} (pessoal)` : a.name,
      }))}
      emptyValue={emptyValue}
      placeholder={placeholder}
      hideIfEmpty={hideIfEmpty}
      isRequired={isRequired}
      {...props}
    />
  )
}
