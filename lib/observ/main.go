package observ

type Object interface{}

type CallbackOwner interface {
	DisposeExposed
}
