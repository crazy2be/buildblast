package observable

type Object interface { }

type CallbackOwner interface {
	DisposeExposed
}