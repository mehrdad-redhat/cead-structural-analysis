module.exports = errorMiddleware;

function errorMiddleware(err, req, res, next) {
    if (process.env.NODE_ENV === 'development') console.error(err);
    switch (true) {
        case typeof err === 'string' && err.toLowerCase().endsWith('not found.'):
            // Not found error
            return res.status(404).json({ message: err });
            
        case err.name === 'customError':
            // custom application error
            return res.status(err.code).send({ message: err.message });
            
        case err.name === 'ValidationError':
            // mongoose validation error
            return res.status(400).json({ message: err.message });
            
        case err.name === 'UnauthorizedError':
            // jwt authentication error
            return res.status(401).json({ message: 'Unauthorized request' });
            
        default:
            return res.status(500).json({ message: err.message });
    }
}
