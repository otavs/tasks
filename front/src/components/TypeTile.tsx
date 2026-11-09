import { cn } from '@/utils/cn'
import { TaskType, taskType } from '@/utils/taskTypes'

/** A type's icon on its little glossy tile, in the type's colours. */
export function TypeTile({
  type,
  className,
  iconClassName,
}: {
  type: TaskType
  className?: string
  iconClassName?: string
}) {
  const { icon: Icon, label } = taskType(type)

  return (
    <span data-type={type} title={label} className={cn('type-tile grid shrink-0 place-items-center', className)}>
      <Icon aria-hidden className={iconClassName} strokeWidth={2.25} />
    </span>
  )
}
