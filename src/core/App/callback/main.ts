
import type { Context, Handler } from '../../types';
import type Router from '../../Router';
import type App from '..';


export default async function main(
	app: App,
	context: Context,
	router: Router,
	handlers: Handler[],
) {
	try {
		for (const handle of handlers) {
			let result = await handle(context);
			if (result === true) { continue; }
			if (result === false || context.finished) { return; }
			if (!result) { continue; }
			result = await router.return(context, result);
			if (result === false || context.finished) { return; }
		}
	} catch (e) {
		try {
			await router.catch(context, e);
		} catch (e) {
			app.log.error(e);
		}
	} finally {
		try {
			await router.finally(context);
		} catch (e) {
			app.log.error(e);
		}
	}
}
