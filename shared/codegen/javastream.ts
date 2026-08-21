/** 常见 Java Stream 片段模板 */

export type StreamTemplate = {
  id: string
  name: string
  code: string
}

export const STREAM_TEMPLATES: StreamTemplate[] = [
  {
    id: 'filter-map-collect',
    name: 'filter → map → toList',
    code: `List<String> names = users.stream()
    .filter(u -> u.getAge() > 18)
    .map(User::getName)
    .collect(Collectors.toList());`,
  },
  {
    id: 'groupby',
    name: 'groupingBy',
    code: `Map<String, List<User>> byCity = users.stream()
    .collect(Collectors.groupingBy(User::getCity));`,
  },
  {
    id: 'tomap',
    name: 'toMap',
    code: `Map<Long, User> map = users.stream()
    .collect(Collectors.toMap(User::getId, Function.identity(), (a, b) -> a));`,
  },
  {
    id: 'joining',
    name: 'joining',
    code: `String csv = users.stream()
    .map(User::getName)
    .collect(Collectors.joining(", "));`,
  },
  {
    id: 'sorted-limit',
    name: 'sorted + limit',
    code: `List<User> top = users.stream()
    .sorted(Comparator.comparing(User::getScore).reversed())
    .limit(10)
    .collect(Collectors.toList());`,
  },
  {
    id: 'flatmap',
    name: 'flatMap',
    code: `List<Order> orders = users.stream()
    .flatMap(u -> u.getOrders().stream())
    .collect(Collectors.toList());`,
  },
  {
    id: 'anymatch',
    name: 'anyMatch / allMatch',
    code: `boolean hasAdmin = users.stream().anyMatch(u -> "ADMIN".equals(u.getRole()));
boolean allActive = users.stream().allMatch(User::isActive);`,
  },
  {
    id: 'reduce',
    name: 'reduce',
    code: `int sum = users.stream()
    .map(User::getScore)
    .reduce(0, Integer::sum);`,
  },
  {
    id: 'optional',
    name: 'findFirst Optional',
    code: `Optional<User> first = users.stream()
    .filter(u -> u.getName().startsWith("A"))
    .findFirst();
User u = first.orElseThrow(() -> new NoSuchElementException("not found"));`,
  },
  {
    id: 'parallel',
    name: 'parallelStream',
    code: `long count = users.parallelStream()
    .filter(User::isActive)
    .count();`,
  },
]

export function getStreamTemplate(id: string): string {
  const t = STREAM_TEMPLATES.find((x) => x.id === id)
  if (!t) throw new Error('未知模板')
  return `import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

${t.code}
`
}
