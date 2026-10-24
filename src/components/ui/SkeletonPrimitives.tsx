import { View } from 'react-native';
import { ListGroup } from './ListGroup';

type SkeletonLineProps = {
  className: string;
  subtle?: boolean;
};

export function SkeletonLine({
  className,
  subtle = false,
}: SkeletonLineProps) {
  return (
    <View
      className={`rounded-full ${
        subtle ? 'bg-hercules-blue/10' : 'bg-hercules-blue/15'
      } ${className}`}
    />
  );
}

type SkeletonSectionHeaderProps = {
  widthClassName?: string;
  showAction?: boolean;
};

export function SkeletonSectionHeader({
  widthClassName = 'w-2/5',
  showAction = false,
}: SkeletonSectionHeaderProps) {
  return (
    <View className="min-h-11 flex-row items-center justify-between">
      <SkeletonLine className={`h-5 ${widthClassName}`} />
      {showAction ? (
        <SkeletonLine className="h-3 w-14" subtle />
      ) : null}
    </View>
  );
}

type SkeletonListRowProps = {
  iconShape?: 'circle' | 'rounded';
  iconTone?: 'red' | 'blue';
  isLast?: boolean;
  titleLines?: 1 | 2;
  subtitleLines?: 0 | 1 | 2;
  subtitleWidthClassNames?: readonly string[];
  metaLines?: 1 | 2;
  metaWidthClassName?: string;
  metaWidth?: number;
  chevronWidthClassName?: string;
  trailing?: 'none' | 'chevron' | 'meta' | 'meta-chevron';
  variant?: 'card' | 'row';
};

export function SkeletonListRow({
  iconShape = 'rounded',
  iconTone = 'blue',
  isLast = false,
  titleLines = 1,
  subtitleLines = 1,
  subtitleWidthClassNames = ['w-3/5', 'w-2/5'],
  metaLines = 1,
  metaWidthClassName,
  metaWidth,
  chevronWidthClassName = 'w-4',
  trailing = 'meta-chevron',
  variant = 'row',
}: SkeletonListRowProps) {
  const containerClassName =
    variant === 'card'
      ? 'min-h-[80px] flex-row items-start gap-3 border-b border-hercules-blue/15 bg-hercules-white py-4'
      : `min-h-[80px] flex-row items-start gap-3 bg-hercules-white py-4 ${
          isLast ? '' : 'border-b border-hercules-blue/10'
        }`;

  return (
    <View className={containerClassName}>
      <View
        className={`mt-0.5 h-8 w-8 shrink-0 ${
          iconShape === 'circle' ? 'rounded-full' : 'rounded-[8px]'
        } ${
          iconTone === 'red'
            ? 'bg-hercules-red/15'
            : 'bg-hercules-blue/15'
        }`}
      />
      <View className="min-w-0 flex-1 gap-1">
        <View>
          {Array.from({ length: titleLines }, (_, index) => (
            <View
              key={`skeleton-title-${index}`}
              className="h-5 justify-center"
            >
              <SkeletonLine
                className={`h-4 ${index === 0 ? 'w-4/5' : 'w-3/5'}`}
              />
            </View>
          ))}
        </View>
        {subtitleLines > 0 ? (
          <View>
            {Array.from({ length: subtitleLines }, (_, index) => (
              <View
                key={`skeleton-subtitle-${index}`}
                className="h-5 justify-center"
              >
                <SkeletonLine
                  className={`h-3 ${
                    subtitleWidthClassNames[index] ?? (index === 0 ? 'w-3/5' : 'w-2/5')
                  }`}
                  subtle
                />
              </View>
            ))}
          </View>
        ) : null}
        {trailing === 'meta' || trailing === 'meta-chevron' ? (
          <View>
            {Array.from({ length: metaLines }, (_, index) => (
              <View
                key={`skeleton-meta-${index}`}
                className="h-4 justify-center"
                style={index === 0 && metaWidth !== undefined ? { width: metaWidth } : undefined}
              >
                <SkeletonLine
                  className={`h-3 ${index === 0
                    ? metaWidth !== undefined ? 'w-full' : metaWidthClassName ?? 'w-16'
                    : 'w-12'}`}
                  subtle
                />
              </View>
            ))}
          </View>
        ) : null}
      </View>
      {trailing === 'chevron' || trailing === 'meta-chevron' ? (
        <View className="h-6 w-4 shrink-0 items-center justify-center self-center">
          <SkeletonLine className={`h-5 ${chevronWidthClassName}`} subtle />
        </View>
      ) : null}
    </View>
  );
}

type SkeletonListProps = Omit<SkeletonListRowProps, 'isLast' | 'variant'> & {
  rows: number;
};

export function SkeletonListGroup({
  rows,
  ...rowProps
}: SkeletonListProps) {
  return (
    <ListGroup>
      {Array.from({ length: rows }, (_, index) => (
        <SkeletonListRow
          key={`skeleton-list-row-${index}`}
          {...rowProps}
          variant="row"
          isLast={index === rows - 1}
          iconTone={index % 2 === 0 ? 'red' : 'blue'}
        />
      ))}
    </ListGroup>
  );
}

export function SkeletonListCards({
  rows,
  ...rowProps
}: SkeletonListProps) {
  return (
    <View className="gap-3">
      {Array.from({ length: rows }, (_, index) => (
        <SkeletonListRow
          key={`skeleton-list-card-${index}`}
          {...rowProps}
          variant="card"
          isLast
          iconTone={index % 2 === 0 ? 'red' : 'blue'}
        />
      ))}
    </View>
  );
}

type SkeletonTextFieldProps = {
  labelWidthClassName?: string;
  multiline?: boolean;
  compact?: boolean;
};

export function SkeletonTextField({
  labelWidthClassName = 'w-1/3',
  multiline = false,
  compact = false,
}: SkeletonTextFieldProps) {
  return (
    <View className={compact ? 'gap-1.5' : 'gap-2'}>
      <View className="h-5 justify-center">
        <SkeletonLine className={`h-3 ${labelWidthClassName}`} />
      </View>
      <View
        className={`rounded-[14px] border border-hercules-blue/15 bg-hercules-white ${
          multiline ? 'h-24' : compact ? 'h-12' : 'h-14'
        }`}
      />
    </View>
  );
}

export function SkeletonPrimaryButton() {
  return <View className="h-14 rounded-pill bg-hercules-red/15" />;
}
