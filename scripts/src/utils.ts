export function pick<T, K extends keyof T>(obj: T, ...props: K[]): Pick<T, K> {
	const newObj = {} as Pick<T, K>;
	props.forEach(name => newObj[name] = obj[name]);
	return newObj;
}